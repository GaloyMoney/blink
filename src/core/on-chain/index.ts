import assert from "assert"

import { Prices, Wallets, Users } from "@app"
import {
  checkAndVerifyTwoFA,
  checkIntraledgerLimits,
  checkWithdrawalLimits,
} from "@app/wallets/check-limit-helpers"
import { BTC_NETWORK, ONCHAIN_SCAN_DEPTH_OUTGOING } from "@config/app"
import { checkedToTargetConfs, toSats, toTargetConfs } from "@domain/bitcoin"
import { checkedToOnChainAddress, TxDecoder } from "@domain/bitcoin/onchain"
import { TwoFANewCodeNeededError } from "@domain/twoFA"
import { WithdrawalFeeCalculator } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { LockService } from "@services/lock"
import { ledger } from "@services/mongodb"
import { User } from "@services/mongoose/schema"
import { NotificationsService } from "@services/notifications"

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

export const OnChainMixin = (superclass) =>
  class extends superclass {
    readonly config: UserWalletConfig

    constructor(args: UserWalletConstructorArgs) {
      super(args)
      this.config = args.config
    }

    async onChainPay({
      address,
      amount,
      memo,
      sendAll = false,
      twoFAToken,
      targetConfirmations,
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

      const walletId_ = this.user.walletId // FIXME: just set this variable for easier code review. long variable would trigger adding a tab and much bigger diff
      return redlock({ path: walletId_, logger: onchainLogger }, async (lock) => {
        const balanceSats = await Wallets.getBalanceForWalletId(this.user.walletId)
        if (balanceSats instanceof Error) throw balanceSats

        onchainLogger = onchainLogger.child({ balanceSats })

        // quit early if balance is not enough
        if (balanceSats < amount) {
          throw new InsufficientBalanceError(undefined, { logger: onchainLogger })
        }

        const payeeUser = await User.getUserByAddress({ address })

        const user = await Users.getUser(this.user.id)
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
                walletId: this.user.walletId,
              })
            : true
          if (twoFACheck instanceof TwoFANewCodeNeededError)
            throw new TwoFAError("Need a 2FA code to proceed with the payment", {
              logger: onchainLogger,
            })
          if (twoFACheck instanceof Error)
            throw new TwoFAError(undefined, { logger: onchainLogger })

          const onchainLoggerOnUs = onchainLogger.child({ onUs: true })

          const intraledgerLimitCheck = await checkIntraledgerLimits({
            amount: toSats(amountToSendPayeeUser),
            walletId: this.user.walletId,
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

          const price = await Prices.getCurrentPrice()
          if (price instanceof Error) throw price
          const onChainFee = toSats(0)
          const usd = sats * price
          const usdFee = onChainFee * price

          const senderWallet = await Wallets.getWallet(this.user.walletId)
          if (senderWallet instanceof Error) throw senderWallet
          const recipientWallet = await Wallets.getWallet(payeeUser.walletId)
          if (recipientWallet instanceof Error) throw recipientWallet

          const journal = await LockService().extendLock(
            { logger: onchainLoggerOnUs, lock },
            async () =>
              LedgerService().addOnChainIntraledgerTxSend({
                senderWalletId: this.user.walletId,
                description: "",
                sats: toSats(sats),
                fee: onChainFee,
                usd,
                usdFee,
                payeeAddresses: [address as OnChainAddress],
                sendAll,
                recipientWalletId: payeeUser.walletId,
                payerUsername: this.user.username,
                recipientUsername: payeeUser.username,
                memoPayer: memo || null,
              }),
          )
          if (journal instanceof Error) throw journal

          const notificationsService = NotificationsService(onchainLoggerOnUs)
          notificationsService.intraLedgerPaid({
            senderWalletId: senderWallet.id,
            recipientWalletId: recipientWallet.id,
            amount: toSats(sats),
            usdPerSat: price,
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
        const checksAmount = sendAll ? balanceSats - this.user.withdrawFee : amount

        if (checksAmount < this.config.dustThreshold) {
          throw new DustAmountError(undefined, { logger: onchainLogger })
        }

        const withdrawalLimitCheck = await checkWithdrawalLimits({
          amount: toSats(checksAmount),
          walletId: this.user.walletId,
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
              walletId: this.user.walletId,
            })
          : true
        if (twoFACheck instanceof TwoFANewCodeNeededError)
          throw new TwoFAError("Need a 2FA code to proceed with the payment", {
            logger: onchainLogger,
          })
        if (twoFACheck instanceof Error)
          throw new TwoFAError(undefined, { logger: onchainLogger })

        const getOnChainBalance = async (): Promise<Satoshis> => {
          const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
          if (onChainService instanceof Error) {
            onchainLogger.fatal({ err: onChainService })
            return toSats(0)
          }

          const onChainBalance = await onChainService.getBalance()
          if (onChainBalance instanceof Error) {
            onchainLogger.fatal({ err: onChainBalance })
            return toSats(0)
          }

          return onChainBalance
        }

        const onChainBalance = await getOnChainBalance()

        let amountToSend

        const sendTo = [{ address, tokens: checksAmount }]

        const checkedAddress = checkedToOnChainAddress({
          network: BTC_NETWORK,
          value: address,
        })
        if (checkedAddress instanceof Error) throw checkedAddress

        const getTargetConfirmations = (): TargetConfirmations => {
          const confs = checkedToTargetConfs(targetConfirmations)
          if (confs instanceof Error) return toTargetConfs(1)
          return confs
        }

        const targetConfs = getTargetConfirmations()

        const estimatedFee = await Wallets.getOnChainFeeByWalletId({
          walletId: this.user.walletId,
          amount: checksAmount,
          address: checkedAddress,
          targetConfirmations: targetConfs,
        })

        if (estimatedFee instanceof Error) {
          const error = `Unable to estimate fee for on-chain transaction`
          onchainLogger.error({ err: estimatedFee, sendTo, success: false }, error)
          throw new Error(error)
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
          if (balanceSats < amountToSend + estimatedFee) {
            throw new InsufficientBalanceError(undefined, { logger: onchainLogger })
          }
        }
        // when sendAll the amount to sendToChainAddress is the whole balance minus the fees
        else {
          amountToSend = balanceSats - estimatedFee

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
          const payToAddress = () => {
            const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
            if (onChainService instanceof Error) return onChainService

            return onChainService.payToAddress({
              address: checkedAddress,
              amount: amountToSend,
              targetConfirmations: targetConfs,
            })
          }

          const txHash = await payToAddress()
          if (txHash instanceof Error) {
            onchainLogger.error(
              { err: txHash, address, tokens: amountToSend, success: false },
              "Impossible to sendToChainAddress",
            )
            return false
          }

          const getOnChainFee = async (txHash: OnChainTxHash): Promise<Satoshis> => {
            const errMsg = "impossible to get fee for onchain payment"

            const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
            if (onChainService instanceof Error) {
              onchainLogger.fatal({ err: onChainService }, errMsg)
              return toSats(0)
            }

            const onChainTxFee = await onChainService.lookupOnChainFee({
              txHash,
              scanDepth: ONCHAIN_SCAN_DEPTH_OUTGOING,
            })
            if (onChainTxFee instanceof Error) {
              onchainLogger.fatal({ err: onChainTxFee }, errMsg)
              return toSats(0)
            }

            return WithdrawalFeeCalculator().onChainWithdrawalFee({
              onChainFee: onChainTxFee,
              walletFee: toSats(this.user.withdrawFee),
            })
          }

          const fee = await getOnChainFee(txHash)

          {
            let sats = amountToSend + fee
            if (sendAll) {
              // when sendAll the amount debited from the account is the whole balance
              sats = balanceSats
            }

            const metadata = {
              hash: txHash,
              payee_addresses: [address],
              ...UserWallet.getCurrencyEquivalent({ sats, fee }),
              sendAll,
            }

            await ledger.addOnchainPayment({
              description: memo,
              sats,
              fee: this.user.withdrawFee,
              walletPath: this.user.walletPath,
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
  }
