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
import { verifyToken } from "node-2fa"

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
  TwoFAError,
  ValidationInternalError,
} from "../error"
import { lockExtendOrThrow, redlock } from "../lock"
import { UserWallet } from "../user-wallet"
import { LoggedError } from "../utils"
import { ONCHAIN_LOOK_BACK, ONCHAIN_LOOK_BACK_OUTGOING } from "@config/app"

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
    const after = Math.max(0, current_block_height - (lookBack || ONCHAIN_LOOK_BACK)) // this is necessary for tests, otherwise after may be negative
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

    constructor(args: UserWalletConstructorArgs) {
      super(args)
      this.config = args.config
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
      twoFAToken,
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

      return redlock({ path: this.user._id, logger: onchainLogger }, async (lock) => {
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

          const remainingTwoFALimit = await this.user.remainingTwoFALimit()

          if (this.user.twoFA.secret && remainingTwoFALimit < amountToSendPayeeUser) {
            if (!twoFAToken) {
              throw new TwoFAError("Need a 2FA code to proceed with the payment", {
                logger: onchainLogger,
              })
            }

            if (!verifyToken(this.user.twoFA.secret, twoFAToken)) {
              throw new TwoFAError(undefined, { logger: onchainLogger })
            }
          }

          const onchainLoggerOnUs = onchainLogger.child({ onUs: true })

          const remainingOnUsLimit = await this.user.remainingOnUsLimit()

          if (remainingOnUsLimit < amountToSendPayeeUser) {
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

        const remainingWithdrawalLimit = await this.user.remainingWithdrawalLimit()

        if (remainingWithdrawalLimit < checksAmount) {
          const error = `Cannot withdraw more than ${this.config.limits.withdrawalLimit} sats in 24 hours`
          throw new TransactionRestrictedError(error, { logger: onchainLogger })
        }

        const remainingTwoFALimit = await this.user.remainingTwoFALimit()

        if (this.user.twoFA.secret && remainingTwoFALimit < checksAmount) {
          if (!twoFAToken) {
            throw new TwoFAError("Need a 2FA code to proceed with the payment", {
              logger: onchainLogger,
            })
          }

          if (!verifyToken(this.user.twoFA.secret, twoFAToken)) {
            throw new TwoFAError(undefined, { logger: onchainLogger })
          }
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
              lookBack: ONCHAIN_LOOK_BACK_OUTGOING,
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
      })
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
  }
