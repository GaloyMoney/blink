import assert from "assert"
import { GetChainTransactionsResult } from "lightning" // TODO remove eventually?
import _ from "lodash"
import moment from "moment"

import { BitcoindClient, BitcoindWalletClient, VOut } from "@services/bitcoind"
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
  sat2btc,
} from "../utils"
import { transactionNotification } from "@core/notifications/payment"

export const OnChainMixin = (superclass) =>
  class extends superclass {
    readonly config: UserWalletConfig
    readonly bitcoindClient: BitcoindClient
    // first approach: a single wallet named "hot"
    readonly bitcoindWalletClient: BitcoindWalletClient

    constructor(...args) {
      super(...args)
      this.config = args[0].config
      this.bitcoindClient = new BitcoindClient()
      this.bitcoindWalletClient = new BitcoindWalletClient({ walletName: "hot" })
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

      if (payeeUser) {
        fee = 0
      } else {
        if (amount && amount < this.config.dustThreshold) {
          throw new DustAmountError(undefined, { logger: this.logger })
        }
        try {
          // (numeric, optional) estimate fee rate in BTC/kB (only present if no errors were encountered)
          const result = await this.bitcoindClient.estimateSmartFee({
            conf_target: 1,
          }) // TODO conf_target
          const feerate = result.feerate
          // 1 BTC/kB = 100000 satoshis/byte
          fee = 100000 * feerate // TODO not sure about this: is fee by size, not a total fee
        } catch (err) {
          console.log(err)
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
        // TODO: unable to check balance.total_in_BTC vs this.dustThreshold at this point...
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

          const onChainBalance = btc2sat(await this.bitcoindWalletClient.getBalance())

          let estimatedFee, id, amountToSend

          const sendTo = [{ address, tokens: checksAmount }]

          try {
            // estimate fee rate in BTC/kB (only present if no errors were encountered)
            const { feerate } = await this.bitcoindClient.estimateSmartFee({
              conf_target: 1,
            }) // TODO conf_target
            // 1 BTC/kB = 100000 satoshis/byte
            // TODO /byte? why this is added to sats amount as is and not based on the transaction size?
            estimatedFee = 100000 * feerate
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
              // TODO include fee here to avoid checking it in the next step
              id = await this.bitcoindWalletClient.sendToAddress({
                address,
                amount: sat2btc(amountToSend),
              })
            } catch (err) {
              onchainLogger.error(
                { err, address, tokens: amountToSend, success: false },
                "Impossible to sendToChainAddress",
              )
              return false
            }

            let fee
            try {
              const txn = await this.bitcoindWalletClient.getTransaction({ txid: id })
              fee = btc2sat(-txn.fee) // fee comes in BTC and negative
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

      const address = await this.bitcoindWalletClient.getNewAddress({
        address_type: "bech32", // TODO confirm
      })

      // TODO pubkey should be known already
      const { pubkey } = await this.bitcoindWalletClient.getAddressInfo({ address })

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

    async getOnchainReceipt({
      confirmed,
    }: {
      confirmed: boolean
    }): Promise<GetChainTransactionsResult["transactions"]> {
      // TODO confirm
      // for a single hot wallet, it is the same pubkey so no filter is required
      const userAddresses = this.user.onchain.map((item) => item.address)

      const count = 10000 // TODO
      const latestTransactions = await this.bitcoindWalletClient.listTransactions({
        count,
      })

      // TODO filter by category "receive" here?

      const filteredByUserAddresses = latestTransactions.filter(
        // only return transactions for addresses that belong to the user
        (tx) => _.intersection([tx.address], userAddresses).length > 0,
      )

      // TODO: expose to the yaml
      const min_confirmation = 2

      // TODO: confirmations could be negative: "Negative confirmations means the transaction conflicted that many blocks ago."

      let toReturnPre
      if (confirmed) {
        toReturnPre = filteredByUserAddresses.filter(
          (tx) => !!tx.confirmations && tx.confirmations >= min_confirmation,
        )
      } else {
        toReturnPre = filteredByUserAddresses.filter(
          (tx) =>
            (!!tx.confirmations && tx.confirmations < min_confirmation) ||
            !tx.confirmations,
        )
      }

      // finally transform to expected format
      return toReturnPre.map((tx) => ({
        block_id: tx.blockhash,
        confirmation_count: tx.confirmations,
        confirmation_height: tx.blockheight, // TODO is this correct?
        created_at: tx.time,
        description: tx.category, // TODO ok? there is also a "comment"
        fee: tx.fee,
        id: tx.txid,
        is_confirmed: tx.confirmations > 0,
        is_outgoing: tx.category === "send",
        output_addresses: [tx.address], // TODO confirm
        tokens: btc2sat(tx.amount), // This is negative for the 'send' category, and is positive for all other categories
        transaction: "", // not available...
      }))
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

      const unconfirmed_promises = unconfirmed_user.map(async ({ id, created_at }) => {
        const { sats, addresses } = await this.getSatsAndAddressPerTxid(id)
        return { sats, addresses, id, created_at }
      })

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

    async getSatsAndAddressPerTxVout(
      vout: [VOut],
    ): Promise<{ sats: number; addresses: string[] }> {
      // const { vout } = await this.bitcoindClient.decodeRawTransaction({ hexstring: tx })

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

      return await { sats, addresses }
    }

    async getSatsAndAddressPerTxid(txid): Promise<{ sats: number; addresses: string[] }> {
      const { decoded } = await this.bitcoindWalletClient.getTransaction({
        txid,
        verbose: true,
      })
      return await this.getSatsAndAddressPerTxVout(decoded.vout)
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
              const { sats, addresses } = await this.getSatsAndAddressPerTxid(
                matched_tx.id,
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
