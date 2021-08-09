import assert from "assert"
import {
  createChainAddress,
  getChainBalance,
  getChainFeeEstimate,
  getChainTransactions,
  GetChainTransactionsResult,
  getHeight,
  sendToChainAddress,
} from "lightning"
import _ from "lodash"
import moment from "moment"

import { bitcoindDefaultClient } from "@services/bitcoind"
import { getActiveOnchainLnd, getLndFromPubkey } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { ledger } from "@services/mongodb"
import { User } from "@services/mongoose/schema"

import {
  DbError,
  DustAmountError,
  InsufficientBalanceError,
  NewAccountWithdrawalError,
  OnChainFeeEstimationError,
  RebalanceNeededError,
  SelfPaymentError,
  TransactionRestrictedError,
  ValidationInternalError,
} from "../error"
import { lockExtendOrThrow, redlock } from "../lock"
import { UserWallet } from "../user-wallet"
import {
  amountOnVout,
  btc2sat,
  LoggedError,
  LOOK_BACK,
  LOOK_BACK_OUTGOING,
  myOwnAddressesOnVout,
} from "../utils"
import { transactionNotification } from "@core/notifications/payment"

export const getOnChainTransactions = async ({
  lnd,
  incoming,
  lookBack,
}: {
  lnd: AuthenticatedLnd
  incoming: boolean
  lookBack?: number
}) => {
  try {
    const { current_block_height } = await getHeight({ lnd })
    const after = Math.max(0, current_block_height - (lookBack || LOOK_BACK)) // this is necessary for tests, otherwise after may be negative
    const { transactions } = await getChainTransactions({ lnd, after })
    return transactions.filter((tx) => incoming === !tx.is_outgoing)
  } catch (err) {
    const error = `issue fetching transaction`
    baseLogger.error({ err, incoming }, error)
    throw new LoggedError(error)
  }
}

export const OnChainMixin = (superclass) =>
  class extends superclass {
    readonly config: UserWalletConfig

    constructor(...args) {
      super(...args)
      this.config = args[0].config
    }

    async updatePending(lock): Promise<void> {
      await super.updatePending(lock)
    }

    async getOnchainFee({
      address,
      amount,
    }: {
      address: string
      amount: number | null
    }): Promise<number> {
      const payeeUser = await User.getUserByAddress({ address })

      let fee

      // FIXME: legacy. is this still necessary?
      const defaultAmount = 300000

      if (payeeUser) {
        fee = 0
      } else {
        if (amount && amount < this.config.dustThreshold) {
          throw new DustAmountError(undefined, { logger: this.logger })
        }

        // FIXME there is a transition if a node get offline for which the fee could be wrong
        // if send by a new node in the meantime. (low probability and low side effect)
        const { lnd } = getActiveOnchainLnd()

        const sendTo = [{ address, tokens: amount ?? defaultAmount }]
        try {
          ;({ fee } = await getChainFeeEstimate({ lnd, send_to: sendTo }))
        } catch (err) {
          throw new OnChainFeeEstimationError(undefined, {
            logger: this.logger,
          })
        }
        fee += this.user.withdrawFee
      }

      return fee
    }

    async onChainPay({
      address,
      amount,
      memo,
      sendAll = false,
    }: IOnChainPayment): Promise<ISuccess> {
      let onchainLogger = this.logger.child({
        topic: "payment",
        protocol: "onchain",
        transactionType: "payment",
        address,
        amount,
        memo,
        sendAll,
      })

      if (!sendAll) {
        if (amount <= 0) {
          const error = "Amount can't be negative, and can only be zero if sendAll = true"
          throw new ValidationInternalError(error, { logger: onchainLogger })
        }

        if (amount < this.config.dustThreshold) {
          throw new DustAmountError(undefined, { logger: onchainLogger })
        }
      }
      // when sendAll the amount should be 0
      else {
        assert(amount === 0)
        /// TODO: unable to check balance.total_in_BTC vs this.dustThreshold at this point...
      }

      return await redlock(
        { path: this.user._id, logger: onchainLogger },
        async (lock) => {
          const balance = await this.getBalances(lock)
          onchainLogger = onchainLogger.child({ balance })

          // quit early if balance is not enough
          if (balance.total_in_BTC < amount) {
            throw new InsufficientBalanceError(undefined, { logger: onchainLogger })
          }

          const payeeUser = await User.getUserByAddress({ address })

          // on us onchain transaction
          if (payeeUser) {
            let amountToSendPayeeUser = amount
            if (sendAll) {
              // when sendAll the amount to send payeeUser is the whole balance
              amountToSendPayeeUser = balance.total_in_BTC
            }

            const onchainLoggerOnUs = onchainLogger.child({ onUs: true })

            if (
              await this.user.limitHit({ on_us: true, amount: amountToSendPayeeUser })
            ) {
              const error = `Cannot transfer more than ${this.config.limits.onUsLimit} sats in 24 hours`
              throw new TransactionRestrictedError(error, { logger: onchainLoggerOnUs })
            }

            if (String(payeeUser._id) === String(this.user._id)) {
              throw new SelfPaymentError(undefined, { logger: onchainLoggerOnUs })
            }

            const sats = amountToSendPayeeUser
            const metadata = {
              type: "onchain_on_us",
              pending: false,
              ...UserWallet.getCurrencyEquivalent({ sats, fee: 0 }),
              payee_addresses: [address],
              sendAll,
            }

            await lockExtendOrThrow({ lock, logger: onchainLoggerOnUs }, async () => {
              const tx = await ledger.addOnUsPayment({
                description: "",
                sats,
                metadata,
                payerUser: this.user,
                payeeUser,
                memoPayer: memo,
                shareMemoWithPayee: false,
                lastPrice: UserWallet.lastPrice,
              })
              return tx
            })

            onchainLoggerOnUs.info(
              { success: true, ...metadata },
              "onchain payment succeed",
            )

            return true
          }

          // normal onchain payment path

          onchainLogger = onchainLogger.child({ onUs: false })

          if (!this.user.oldEnoughForWithdrawal) {
            const error = `New accounts have to wait ${this.config.limits.oldEnoughForWithdrawalHours}h before withdrawing`
            throw new NewAccountWithdrawalError(error, { logger: onchainLogger })
          }

          /// when sendAll the amount is closer to the final one by deducting the withdrawFee
          const checksAmount = sendAll
            ? balance.total_in_BTC - this.user.withdrawFee
            : amount

          if (checksAmount < this.config.dustThreshold) {
            throw new DustAmountError(undefined, { logger: onchainLogger })
          }

          if (await this.user.limitHit({ on_us: false, amount: checksAmount })) {
            const error = `Cannot withdraw more than ${this.config.limits.withdrawalLimit} sats in 24 hours`
            throw new TransactionRestrictedError(error, { logger: onchainLogger })
          }

          const { lnd } = getActiveOnchainLnd()

          const { chain_balance: onChainBalance } = await getChainBalance({ lnd })

          let estimatedFee, id, amountToSend

          const sendTo = [{ address, tokens: checksAmount }]

          try {
            ;({ fee: estimatedFee } = await getChainFeeEstimate({ lnd, send_to: sendTo }))
          } catch (err) {
            const error = `Unable to estimate fee for on-chain transaction`
            onchainLogger.error({ err, sendTo, success: false }, error)
            throw new LoggedError(error)
          }

          if (!sendAll) {
            amountToSend = amount

            // case where there is not enough money available within lnd on-chain wallet
            if (onChainBalance < amountToSend + estimatedFee) {
              // TODO: add a page to initiate the rebalancing quickly
              throw new RebalanceNeededError(undefined, {
                logger: onchainLogger,
                onChainBalance,
                amount: amountToSend,
                sendAll,
                estimatedFee,
                sendTo,
                success: false,
              })
            }

            // case where the user doesn't have enough money
            if (
              balance.total_in_BTC <
              amountToSend + estimatedFee + this.user.withdrawFee
            ) {
              throw new InsufficientBalanceError(undefined, { logger: onchainLogger })
            }
          }
          // when sendAll the amount to sendToChainAddress is the whole balance minus the fees
          else {
            amountToSend = balance.total_in_BTC - estimatedFee - this.user.withdrawFee

            // case where there is not enough money available within lnd on-chain wallet
            if (onChainBalance < amountToSend) {
              // TODO: add a page to initiate the rebalancing quickly
              throw new RebalanceNeededError(undefined, {
                logger: onchainLogger,
                onChainBalance,
                amount: amountToSend,
                sendAll,
                estimatedFee,
                sendTo,
                success: false,
              })
            }

            // case where the user doesn't have enough money (fees are more than the whole balance)
            if (amountToSend < 0) {
              throw new InsufficientBalanceError(undefined, { logger: onchainLogger })
            }
          }

          return lockExtendOrThrow({ lock, logger: onchainLogger }, async () => {
            try {
              ;({ id } = await sendToChainAddress({ address, lnd, tokens: amountToSend }))
            } catch (err) {
              onchainLogger.error(
                { err, address, tokens: amountToSend, success: false },
                "Impossible to sendToChainAddress",
              )
              return false
            }

            let fee
            try {
              const outgoingOnchainTxns = await getOnChainTransactions({
                lnd,
                incoming: false,
                lookBack: LOOK_BACK_OUTGOING,
              })
              const [{ fee: fee_ }] = outgoingOnchainTxns.filter((tx) => tx.id === id)
              fee = fee_
            } catch (err) {
              onchainLogger.fatal({ err }, "impossible to get fee for onchain payment")
              fee = 0
            }

            fee += this.user.withdrawFee

            {
              let sats = amount + fee
              if (sendAll) {
                // when sendAll the amount debited from the account is the whole balance
                sats = balance.total_in_BTC
              }

              const metadata = {
                hash: id,
                ...UserWallet.getCurrencyEquivalent({ sats, fee }),
                sendAll,
              }

              await ledger.addOnchainPayment({
                description: memo,
                sats,
                fee: this.user.withdrawFee,
                account: this.user.accountPath,
                metadata,
              })

              onchainLogger.info(
                { success: true, ...metadata },
                "successful onchain payment",
              )
            }

            return true
          })
        },
      )
    }

    async getLastOnChainAddress(): Promise<string> {
      if (this.user.onchain.length === 0) {
        // FIXME this should not be done in a query but only in a mutation?
        await this.getOnChainAddress()
      }

      return _.last(this.user.onchain_addresses) as string
    }

    async getOnChainAddress(): Promise<string> {
      // TODO
      // another option to investigate is to have a master key / client
      // (maybe this could be saved in JWT)
      // and a way for them to derive new key
      //
      // this would avoid a communication to the server
      // every time you want to show a QR code.

      let address

      const { lnd, pubkey } = getActiveOnchainLnd()

      try {
        ;({ address } = await createChainAddress({
          lnd,
          format: "p2wpkh",
        }))
      } catch (err) {
        const error = `error getting on chain address`
        this.logger.error({ err }, error)
        throw new LoggedError(error)
      }

      try {
        this.user.onchain.push({ address, pubkey })
        await this.user.save()
      } catch (err) {
        const error = `error storing new onchain address to db`
        throw new DbError(error, {
          forwardToClient: false,
          logger: this.logger,
          level: "warn",
          err,
        })
      }

      return address
    }

    async getOnchainReceipt({ confirmed }: { confirmed: boolean }) {
      const pubkeys: string[] = this.user.onchain_pubkey
      let user_matched_txs: GetChainTransactionsResult["transactions"] = []

      for (const pubkey of pubkeys) {
        // TODO: optimize the data structure
        const addresses = this.user.onchain
          .filter((item) => (item.pubkey = pubkey))
          .map((item) => item.address)

        let lnd: AuthenticatedLnd

        try {
          ;({ lnd } = getLndFromPubkey({ pubkey }))
        } catch (err) {
          // FIXME pass logger
          baseLogger.warn({ pubkey }, "node is offline")
          continue
        }

        const lnd_incoming_txs = await getOnChainTransactions({ lnd, incoming: true })

        // for unconfirmed tx:
        // { block_id: undefined,
        //   confirmation_count: undefined,
        //   confirmation_height: undefined,
        //   created_at: '2021-03-09T12:55:09.000Z',
        //   description: undefined,
        //   fee: undefined,
        //   id: '60dfde7a0c5209c1a8438a5c47bb5e56249eae6d0894d140996ec0dcbbbb5f83',
        //   is_confirmed: false,
        //   is_outgoing: false,
        //   output_addresses: [Array],
        //   tokens: 100000000,
        //   transaction: '02000000000...' }

        // for confirmed tx
        // { block_id: '0000000000000b1fa86d936adb8dea741a9ecd5f6a58fc075a1894795007bdbc',
        //   confirmation_count: 712,
        //   confirmation_height: 1744148,
        //   created_at: '2020-05-14T01:47:22.000Z',
        //   fee: undefined,
        //   id: '5e3d3f679bbe703131b028056e37aee35a193f28c38d337a4aeb6600e5767feb',
        //   is_confirmed: true,
        //   is_outgoing: false,
        //   output_addresses: [Array],
        //   tokens: 10775,
        //   transaction: '020000000001.....' }

        let lnd_incoming_filtered: GetChainTransactionsResult["transactions"]

        const minConfirmations = this.config.onchainMinConfirmations

        if (confirmed) {
          lnd_incoming_filtered = lnd_incoming_txs.filter(
            (tx) => !!tx.confirmation_count && tx.confirmation_count >= minConfirmations,
          )
        } else {
          lnd_incoming_filtered = lnd_incoming_txs.filter(
            (tx) =>
              (!!tx.confirmation_count && tx.confirmation_count < minConfirmations) ||
              !tx.confirmation_count,
          )
        }

        user_matched_txs = [
          ...user_matched_txs,
          ...lnd_incoming_filtered.filter(
            // only return transactions for addresses that belond to the user
            (tx) => _.intersection(tx.output_addresses, addresses).length > 0,
          ),
        ]
      }

      return user_matched_txs
    }

    async getTransactions() {
      const confirmed: ITransaction[] = await super.getTransactions()

      //  ({
      //   created_at: moment(item.timestamp).unix(),
      //   amount: item.credit - item.debit,
      //   sat: item.sat,
      //   usd: item.usd,
      //   description: item.memoPayer || item.memo || item.type, // TODO remove `|| item.type` once users have upgraded
      //   type: item.type,
      //   hash: item.hash,
      //   fee: item.fee,
      //   feeUsd: item.feeUsd,
      //   // destination: TODO
      //   pending: item.pending,
      //   id: item._id,
      //   currency: item.currency
      //  })

      // TODO: should have outgoing unconfirmed transaction as well.
      // they are in ledger, but not necessarily confirmed

      let unconfirmed_user: GetChainTransactionsResult["transactions"] = []

      try {
        unconfirmed_user = await this.getOnchainReceipt({ confirmed: false })
      } catch (err) {
        baseLogger.warn({ user: this.user }, "impossible to fetch transactions")
        unconfirmed_user = []
      }

      // {
      //   block_id: undefined,
      //   confirmation_count: undefined,
      //   confirmation_height: undefined,
      //   created_at: '2020-10-06T17:18:26.000Z',
      //   description: undefined,
      //   fee: undefined,
      //   id: '709dcc443014d14bf906b551d60cdb814d6f98f1caa3d40dcc49688175b2146a',
      //   is_confirmed: false,
      //   is_outgoing: false,
      //   output_addresses: [Array],
      //   tokens: 100000000,
      //   transaction: '020000000001019b5e33c844cc72b093683cec8f743f1ddbcf075077e5851cc8a598a844e684850100000000feffffff022054380c0100000016001499294eb1f4936f15472a891ba400dc09bfd0aa7b00e1f505000000001600146107c29ed16bf7712347ddb731af713e68f1a50702473044022016c03d070341b8954fe8f956ed1273bb3852d3b4ba0d798e090bb5fddde9321a022028dad050cac2e06fb20fad5b5bb6f1d2786306d90a1d8d82bf91e03a85e46fa70121024e3c0b200723dda6862327135ab70941a94d4f353c51f83921fcf4b5935eb80495000000'
      // }

      const unconfirmed_promises = unconfirmed_user.map(
        async ({ transaction, id, created_at }) => {
          const { sats, addresses } = await this.getSatsAndAddressPerTx(transaction)
          return { sats, addresses, id, created_at }
        },
      )

      type unconfirmedType = { sats; addresses; id; created_at }
      const unconfirmed: unconfirmedType[] = await Promise.all(unconfirmed_promises)

      return [
        ...unconfirmed.map(({ sats, addresses, id, created_at }) => ({
          id,
          amount: sats,
          pending: true,
          created_at: moment(created_at).unix(),
          sat: sats,
          usd: UserWallet.satsToUsd(sats),
          description: "pending",
          type: "onchain_receipt" as const,
          hash: id,
          currency: "BTC",
          fee: 0,
          feeUsd: 0,
          addresses,
        })),
        ...confirmed,
      ]
    }

    // raw encoded transaction
    async getSatsAndAddressPerTx(tx): Promise<{ sats: number; addresses: string[] }> {
      const { vout } = await bitcoindDefaultClient.decodeRawTransaction({ hexstring: tx })

      //   vout: [
      //   {
      //     value: 1,
      //     n: 0,
      //     scriptPubKey: {
      //       asm: '0 13584315784642a24d62c7dd1073f24c60604a10',
      //       hex: '001413584315784642a24d62c7dd1073f24c60604a10',
      //       reqSigs: 1,
      //       type: 'witness_v0_keyhash',
      //       addresses: [ 'bcrt1qzdvyx9tcgep2yntzclw3quljf3sxqjsszrwx2x' ]
      //     }
      //   },
      //   {
      //     value: 46.9999108,
      //     n: 1,
      //     scriptPubKey: {
      //       asm: '0 44c6e3f09c2462f9825e441a69d3f2c2325f3ab8',
      //       hex: '001444c6e3f09c2462f9825e441a69d3f2c2325f3ab8',
      //       reqSigs: 1,
      //       type: 'witness_v0_keyhash',
      //       addresses: [ 'bcrt1qgnrw8uyuy330nqj7gsdxn5ljcge97w4cu4c7m0' ]
      //     }
      //   }
      // ]

      // we have to look at the precise vout because lnd sums up the value at the transaction level, not at the vout level.
      // ie: if an attacker send 10 to user A at Galoy, and 10 to user B at galoy in a sinle transaction,
      // both would be credited 20, unless we do the below filtering.
      const value = amountOnVout({ vout, addresses: this.user.onchain_addresses })
      const sats = btc2sat(value)

      const addresses = myOwnAddressesOnVout({
        vout,
        addresses: this.user.onchain_addresses,
      })

      return { sats, addresses }
    }

    async updateOnchainReceipt(lock?) {
      const user_matched_txs = await this.getOnchainReceipt({ confirmed: true })

      const type = "onchain_receipt"

      await redlock(
        { path: this.user._id, logger: baseLogger /* FIXME */, lock },
        async () => {
          // FIXME O(n) ^ 2. bad.
          for (const matched_tx of user_matched_txs) {
            // has the transaction has not been added yet to the user account?
            //
            // note: the fact we fiter with `account_path: this.user.accountPath` could create
            // double transaction for some non customer specific wallet. ie: if the path is different
            // for the dealer. this is fixed now but something to think about.
            const query = { type, hash: matched_tx.id }
            const count = await ledger.getAccountTransactionsCount(
              this.user.accountPath,
              query,
            )

            if (!count) {
              const { sats, addresses } = await this.getSatsAndAddressPerTx(
                matched_tx.transaction,
              )
              assert(matched_tx.tokens >= sats)

              const fee = Math.round(sats * this.user.depositFeeRatio)

              const metadata = {
                hash: matched_tx.id,
                ...UserWallet.getCurrencyEquivalent({ sats, fee }),
                payee_addresses: addresses,
              }

              await ledger.addOnchainReceipt({
                description: "",
                sats,
                fee,
                account: this.user.accountPath,
                metadata,
              })

              const onchainLogger = this.logger.child({
                topic: "payment",
                protocol: "onchain",
                transactionType: "receipt",
                onUs: false,
              })

              onchainLogger.info({ success: true, ...metadata })

              await transactionNotification({
                type,
                user: this.user,
                logger: onchainLogger,
                amount: sats,
                txid: matched_tx.id,
              })
            }
          }
        },
      )
    }
  }
