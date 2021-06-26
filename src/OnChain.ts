import { assert } from "console"
import _ from "lodash"
import moment from "moment"
import { customerPath, lndAccountingPath, onchainRevenuePath } from "./ledger/ledger"
import { lnd } from "./lndConfig"
import { lockExtendOrThrow, redlock } from "./lock"
import { MainBook } from "./mongodb"
import { IOnChainPayment, ISuccess, ITransaction } from "./types"
import {
  amountOnVout,
  bitcoindDefaultClient,
  btc2sat,
  LoggedError,
  LOOK_BACK,
  myOwnAddressesOnVout,
} from "./utils"
import { baseLogger } from "./logger"
import { UserWallet } from "./userWallet"
import { Transaction, User } from "./schema"
import {
  AuthenticatedLnd,
  createChainAddress,
  getChainBalance,
  getChainFeeEstimate,
  getChainTransactions,
  getHeight,
  sendToChainAddress,
} from "lightning"

import { yamlConfig } from "./config"
import {
  DbError,
  DustAmountError,
  InsufficientBalanceError,
  NewAccountWithdrawalError,
  RebalanceNeededError,
  SelfPaymentError,
  TransactionRestrictedError,
  ValidationError,
} from "./error"

export const getOnChainTransactions = async ({
  lnd,
  incoming,
}: {
  lnd: AuthenticatedLnd
  incoming: boolean
}) => {
  try {
    const { current_block_height } = await getHeight({ lnd })
    const after = Math.max(0, current_block_height - LOOK_BACK) // this is necessary for tests, otherwise after may be negative
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
    constructor(...args) {
      super(...args)
    }

    async updatePending(lock): Promise<void> {
      await Promise.all([this.updateOnchainReceipt(lock), super.updatePending(lock)])
    }

    // FIXME: should be static but doesn't work with mixin
    // this would return a User if address belong to our wallet
    async tentativelyGetPayeeUser({ address }) {
      return User.findOne({ onchain_addresses: { $in: address } })
    }

    async getOnchainFee({
      address,
      amount,
    }: {
      address: string
      amount: number | null
    }): Promise<number> {
      const payeeUser = await this.tentativelyGetPayeeUser({ address })

      let fee

      const defaultAmount = 300000

      if (payeeUser) {
        fee = 0
      } else {
        const sendTo = [{ address, tokens: amount ?? defaultAmount }]
        ;({ fee } = await getChainFeeEstimate({ lnd, send_to: sendTo }))
        fee += this.user.withdrawFee
      }

      return fee
    }

    // amount in sats
    async onChainPay({ address, amount, memo }: IOnChainPayment): Promise<ISuccess> {
      let onchainLogger = this.logger.child({
        topic: "payment",
        protocol: "onchain",
        transactionType: "payment",
        address,
        amount,
        memo,
      })

      if (amount <= 0) {
        const error = "Amount can't be negative"
        throw new ValidationError(error, { logger: onchainLogger })
      }

      if (amount < yamlConfig.onchainDustAmount) {
        throw new DustAmountError(undefined, { logger: onchainLogger })
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

          const payeeUser = await this.tentativelyGetPayeeUser({ address })

          if (payeeUser) {
            const onchainLoggerOnUs = onchainLogger.child({ onUs: true })

            if (await this.user.limitHit({ on_us: true, amount })) {
              const error = `Cannot transfer more than ${
                yamlConfig.limits.onUs.level[this.user.level]
              } sats in 24 hours`
              throw new TransactionRestrictedError(error, { logger: onchainLoggerOnUs })
            }

            if (String(payeeUser._id) === String(this.user._id)) {
              throw new SelfPaymentError(undefined, { logger: onchainLoggerOnUs })
            }

            const sats = amount
            const metadata = {
              currency: "BTC",
              type: "onchain_on_us",
              pending: false,
              ...UserWallet.getCurrencyEquivalent({ sats, fee: 0 }),
              payee_addresses: [address],
            }

            await lockExtendOrThrow({ lock, logger: onchainLoggerOnUs }, async () => {
              MainBook.entry()
                .credit(customerPath(payeeUser._id), sats, metadata)
                .debit(this.user.accountPath, sats, { ...metadata, memo })
                .commit()
            })

            onchainLoggerOnUs.info(
              { success: true, ...metadata },
              "onchain payment succeed",
            )

            return true
          }

          onchainLogger = onchainLogger.child({ onUs: false })

          if (!this.user.oldEnoughForWithdrawal) {
            const error = `New accounts have to wait ${
              yamlConfig.limits.oldEnoughForWithdrawal / (60 * 60 * 1000)
            }h before withdrawing`
            throw new NewAccountWithdrawalError(error, { logger: onchainLogger })
          }

          if (await this.user.limitHit({ on_us: false, amount })) {
            const error = `Cannot withdraw more than ${
              yamlConfig.limits.withdrawal.level[this.user.level]
            } sats in 24 hours`
            throw new TransactionRestrictedError(error, { logger: onchainLogger })
          }

          const { chain_balance: onChainBalance } = await getChainBalance({ lnd })

          let estimatedFee, id

          const sendTo = [{ address, tokens: amount }]

          try {
            ;({ fee: estimatedFee } = await getChainFeeEstimate({ lnd, send_to: sendTo }))
          } catch (err) {
            const error = `Unable to estimate fee for on-chain transaction`
            onchainLogger.error({ err, sendTo, success: false }, error)
            throw new LoggedError(error)
          }

          // case where there is not enough money available within lnd on-chain wallet
          if (onChainBalance < amount + estimatedFee) {
            // TODO: add a page to initiate the rebalancing quickly
            throw new RebalanceNeededError(undefined, {
              logger: onchainLogger,
              onChainBalance,
              amount,
              estimatedFee,
              sendTo,
              success: false,
            })
          }

          //add a flat fee on top of onchain miner fees
          estimatedFee += this.user.withdrawFee

          // case where the user doesn't have enough money
          if (balance.total_in_BTC < amount + estimatedFee) {
            throw new InsufficientBalanceError(undefined, { logger: onchainLogger })
          }

          return lockExtendOrThrow({ lock, logger: onchainLogger }, async () => {
            try {
              ;({ id } = await sendToChainAddress({ address, lnd, tokens: amount }))
            } catch (err) {
              onchainLogger.error(
                { err, address, tokens: amount, success: false },
                "Impossible to sendToChainAddress",
              )
              return false
            }

            let fee
            try {
              const outgoingOnchainTxns = await getOnChainTransactions({
                lnd,
                incoming: false,
              })
              const [{ fee: fee_ }] = outgoingOnchainTxns.filter((tx) => tx.id === id)
              fee = fee_
            } catch (err) {
              onchainLogger.fatal({ err }, "impossible to get fee for onchain payment")
              fee = 0
            }

            {
              fee += this.user.withdrawFee
              const sats = amount + fee
              const metadata = {
                currency: "BTC",
                hash: id,
                type: "onchain_payment",
                pending: true,
                ...UserWallet.getCurrencyEquivalent({ sats, fee }),
              }

              // TODO/FIXME refactor. add the transaction first and set the fees in a second tx.
              await MainBook.entry(memo)
                .credit(lndAccountingPath, sats - this.user.withdrawFee, metadata)
                .credit(onchainRevenuePath, this.user.withdrawFee, metadata)
                .debit(this.user.accountPath, sats, metadata)
                .commit()

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
      if (this.user.onchain_addresses.length === 0) {
        // FIXME this should not be done in a query but only in a mutation?
        await this.getOnChainAddress()
      }

      return _.last(this.user.onchain_addresses) as string
    }

    async getOnChainAddress(): Promise<string> {
      // another option to investigate is to have a master key / client
      // (maybe this could be saved in JWT)
      // and a way for them to derive new key
      //
      // this would avoid a communication to the server
      // every time you want to show a QR code.

      let address

      try {
        const format = "p2wpkh"
        const response = await createChainAddress({
          lnd,
          format,
        })
        address = response.address
      } catch (err) {
        const error = `error getting on chain address`
        this.logger.error({ err }, error)
        throw new LoggedError(error)
      }

      try {
        this.user.onchain_addresses.push(address)
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
      // optimization to remove the need to fetch lnd when no address
      // mainly useful for testing purpose
      // we could only generate an onchain_address the first time the client request it
      // as opposed to the first time the client log in
      if (!this.user.onchain_addresses.length) {
        return []
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

      let lnd_incoming_filtered

      // TODO: expose to the yaml
      const min_confirmation = 2

      if (confirmed) {
        lnd_incoming_filtered = lnd_incoming_txs.filter(
          (tx) => !!tx.confirmation_count && tx.confirmation_count >= min_confirmation,
        )
      } else {
        lnd_incoming_filtered = lnd_incoming_txs.filter(
          (tx) =>
            (!!tx.confirmation_count && tx.confirmation_count < min_confirmation) ||
            !tx.confirmation_count,
        )
      }

      const user_matched_txs = lnd_incoming_filtered.filter(
        (tx) =>
          _.intersection(tx.output_addresses, this.user.onchain_addresses).length > 0,
      )

      return user_matched_txs
    }

    async getTransactions(): Promise<Array<ITransaction>> {
      const confirmed = await super.getTransactions()

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
      // they are in medici, but not necessarily confirmed

      const unconfirmed_all = await this.getOnchainReceipt({ confirmed: false })

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

      const unconfirmed_promises = unconfirmed_all.map(
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
          type: "onchain_receipt",
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
    async getSatsAndAddressPerTx(tx) {
      const { vout } = await bitcoindDefaultClient.decodeRawTransaction(tx)

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
      const value = amountOnVout({ vout, onchain_addresses: this.user.onchain_addresses })
      const sats = btc2sat(value)

      const addresses = myOwnAddressesOnVout({
        vout,
        onchain_addresses: this.user.onchain_addresses,
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
            const mongotx = await Transaction.findOne({
              accounts: this.user.accountPath,
              type,
              hash: matched_tx.id,
            })

            if (!mongotx) {
              const { sats, addresses } = await this.getSatsAndAddressPerTx(
                matched_tx.transaction,
              )
              assert(matched_tx.tokens >= sats)

              const fee = Math.round(sats * this.user.depositFeeRatio)

              const metadata = {
                currency: "BTC",
                type,
                hash: matched_tx.id,
                pending: false,
                ...UserWallet.getCurrencyEquivalent({ sats, fee }),
                payee_addresses: addresses,
              }

              await MainBook.entry()
                .credit(onchainRevenuePath, fee, metadata)
                .credit(this.user.accountPath, sats - fee, metadata)
                .debit(lndAccountingPath, sats, metadata)
                .commit()

              const onchainLogger = this.logger.child({
                topic: "payment",
                protocol: "onchain",
                transactionType: "receipt",
                onUs: false,
              })
              onchainLogger.info({ success: true, ...metadata })
            }
          }
        },
      )
    }
  }
