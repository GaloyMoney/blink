import assert from "assert"
import { getChainBalance, getChainFeeEstimate, sendToChainAddress } from "lightning"

import { getActiveOnchainLnd } from "@services/lnd/utils"
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
import { BTC_NETWORK, ONCHAIN_LOOK_BACK_OUTGOING } from "@config/app"
import * as Wallets from "@app/wallets"
import { toSats } from "@domain/bitcoin"
import { UsersRepository, WalletsRepository } from "@services/mongoose"
import { CouldNotFindError } from "@domain/errors"
import { LedgerService } from "@services/ledger"
import { toLiabilitiesAccountId } from "@domain/ledger"
import { LockService } from "@services/lock"
import {
  checkAndVerifyTwoFA,
  checkIntraledgerLimits,
  checkWithdrawalLimits,
} from "@app/wallets/check-limit-helpers"
import { TwoFANewCodeNeededError } from "@domain/twoFA"
import { getCurrentPrice } from "@app/prices"
import { NotificationsService } from "@services/notifications"
import { OnChainService } from "@services/lnd/onchain-service"
import { TxDecoder } from "@domain/bitcoin/onchain"

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
                walletId: this.user.id,
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
            walletId: this.user.id,
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

          const price = await getCurrentPrice()
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
                payerUsername: this.user.username,
                recipientUsername: payeeUser.username,
                memoPayer: memo || null,
              }),
          )
          if (journal instanceof Error) throw journal

          const notificationsService = NotificationsService(onchainLoggerOnUs)
          notificationsService.intraLedgerPaid({
            payerWalletId: payerWallet.id,
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
          walletId: this.user.id,
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
              walletId: this.user.id,
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
        const targetConfs = targetConfirmations > 0 ? targetConfirmations : 1

        try {
          ;({ fee: estimatedFee } = await getChainFeeEstimate({
            lnd,
            send_to: sendTo,
            target_confirmations: targetConfs,
          }))
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
              target_confirmations: targetConfs,
            }))
          } catch (err) {
            onchainLogger.error(
              { err, address, tokens: amountToSend, success: false },
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

            const onChainTxFee = await onChainService.findOnChainFee({
              txHash,
              scanDepth: ONCHAIN_LOOK_BACK_OUTGOING,
            })
            if (onChainTxFee instanceof Error) {
              onchainLogger.fatal({ err: onChainTxFee }, errMsg)
              return toSats(0)
            }

            return onChainTxFee
          }

          const fee = (await getOnChainFee(id)) + this.user.withdrawFee

          {
            let sats = amount + fee
            if (sendAll) {
              // when sendAll the amount debited from the account is the whole balance
              sats = balanceSats
            }

            const metadata = {
              hash: id,
              payee_addresses: [address],
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
  }
