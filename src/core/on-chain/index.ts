import assert from "assert"
import {
  getChainBalance,
  getChainFeeEstimate,
  getChainTransactions,
  GetChainTransactionsResult,
  getHeight,
  sendToChainAddress,
} from "lightning"
import _ from "lodash"

import { getActiveOnchainLnd, getLndFromPubkey } from "@services/lnd/utils"
import { baseLogger } from "@services/logger"
import { ledger } from "@services/mongodb"
import { User } from "@services/mongoose/schema"

import {
  DustAmountError,
  InsufficientBalanceError,
  NewAccountWithdrawalError,
  RebalanceNeededError,
  SelfPaymentError,
  TransactionRestrictedError,
  TwoFAError,
  ValidationInternalError,
} from "../error"
import { redlock } from "../lock"
import { UserWallet } from "../user-wallet"
import { LoggedError } from "../utils"
import { ONCHAIN_LOOK_BACK, ONCHAIN_LOOK_BACK_OUTGOING } from "@config/app"
import * as Wallets from "@app/wallets"
import { PriceService } from "@services/price"
import { toSats } from "@domain/bitcoin"
import { UsersRepository, WalletsRepository } from "@services/mongoose"
import { CouldNotFindError } from "@domain/errors"
import { LedgerService } from "@services/ledger"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { LockService } from "@services/lock"
import { checkAndVerifyTwoFA, getLimitsChecker } from "@core/accounts/helpers"
import { TwoFANewCodeNeededError } from "@domain/twoFA"

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
        /// TODO: unable to check balanceSats vs this.dustThreshold at this point...
      }

      return redlock({ path: this.user._id, logger: onchainLogger }, async (lock) => {
        const balanceSats = await Wallets.getBalanceForWallet({
          walletId: this.user.id,
          logger: onchainLogger,
          lock,
        })
        if (balanceSats instanceof Error) throw balanceSats

        onchainLogger = onchainLogger.child({ balanceSats })

        // quit early if balance is not enough
        if (balanceSats < amount) {
          throw new InsufficientBalanceError(undefined, { logger: onchainLogger })
        }

        const payeeUser = await User.getUserByAddress({ address })

        const limitsChecker = await getLimitsChecker(this.user.id)
        if (limitsChecker instanceof Error) throw limitsChecker

        const user = await UsersRepository().findById(this.user.id)
        if (user instanceof Error) throw user
        const { twoFA } = user

        // on us onchain transaction
        if (payeeUser) {
          let amountToSendPayeeUser = amount
          if (sendAll) {
            // when sendAll the amount to send payeeUser is the whole balance
            amountToSendPayeeUser = balanceSats
          }

          const twoFACheck = twoFA?.secret
            ? await checkAndVerifyTwoFA({
                amount: toSats(amountToSendPayeeUser),
                twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
                twoFASecret: twoFA.secret,
                limitsChecker,
              })
            : true
          if (twoFACheck instanceof TwoFANewCodeNeededError)
            throw new TwoFAError("Need a 2FA code to proceed with the payment", {
              logger: onchainLogger,
            })
          if (twoFACheck instanceof Error)
            throw new TwoFAError(undefined, { logger: onchainLogger })

          const onchainLoggerOnUs = onchainLogger.child({ onUs: true })

          const intraledgerLimitCheck = limitsChecker.checkIntraledger({
            amount: toSats(amountToSendPayeeUser),
          })
          if (intraledgerLimitCheck instanceof Error)
            throw new TransactionRestrictedError(intraledgerLimitCheck.message, {
              logger: onchainLoggerOnUs,
            })

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

          const price = await PriceService().getCurrentPrice()
          if (price instanceof Error) throw price
          const onChainFee = toSats(0)
          const usd = sats * price
          const usdFee = onChainFee * price

          const payerWallet = await WalletsRepository().findById(this.user.id)
          if (payerWallet instanceof CouldNotFindError) throw payerWallet
          if (payerWallet instanceof Error) throw payerWallet
          const recipientWallet = await WalletsRepository().findById(payeeUser.id)
          if (recipientWallet instanceof CouldNotFindError) throw recipientWallet
          if (recipientWallet instanceof Error) throw recipientWallet

          const journal = await LockService().extendLock(
            { logger: onchainLoggerOnUs, lock },
            async () =>
              LedgerService().addOnChainIntraledgerTxSend({
                liabilitiesAccountId: toLiabilitiesAccountId(this.user.id),
                description: "",
                sats: toSats(sats),
                fee: onChainFee,
                usd,
                usdFee,
                payeeAddresses: [address as OnChainAddress],
                sendAll,
                recipientLiabilitiesAccountId: toLiabilitiesAccountId(payeeUser.id),
                payerWalletName: payerWallet.walletName,
                recipientWalletName: recipientWallet.walletName,
                memoPayer: memo || null,
                shareMemoWithPayee: false,
              }),
          )
          if (journal instanceof Error) throw journal

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
        const checksAmount = sendAll ? balanceSats - this.user.withdrawFee : amount

        if (checksAmount < this.config.dustThreshold) {
          throw new DustAmountError(undefined, { logger: onchainLogger })
        }

        const withdrawalLimitCheck = limitsChecker.checkWithdrawal({
          amount: toSats(checksAmount),
        })
        if (withdrawalLimitCheck instanceof Error)
          throw new TransactionRestrictedError(withdrawalLimitCheck.message, {
            logger: onchainLogger,
          })

        const twoFACheck = twoFA?.secret
          ? await checkAndVerifyTwoFA({
              amount: toSats(checksAmount),
              twoFAToken: twoFAToken ? (twoFAToken as TwoFAToken) : null,
              twoFASecret: twoFA.secret,
              limitsChecker,
            })
          : true
        if (twoFACheck instanceof TwoFANewCodeNeededError)
          throw new TwoFAError("Need a 2FA code to proceed with the payment", {
            logger: onchainLogger,
          })
        if (twoFACheck instanceof Error)
          throw new TwoFAError(undefined, { logger: onchainLogger })

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
          if (balanceSats < amountToSend + estimatedFee + this.user.withdrawFee) {
            throw new InsufficientBalanceError(undefined, { logger: onchainLogger })
          }
        }
        // when sendAll the amount to sendToChainAddress is the whole balance minus the fees
        else {
          amountToSend = balanceSats - estimatedFee - this.user.withdrawFee

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

        const lockArgs = { logger: onchainLogger, lock }
        const result = await LockService().extendLock(lockArgs, async () => {
          try {
            ;({ id } = await sendToChainAddress({
              address,
              lnd,
              tokens: amountToSend,
              utxo_confirmations: 0,
            }))
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
              sats = balanceSats
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
        if (result instanceof Error) throw result
        return result
      })
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
