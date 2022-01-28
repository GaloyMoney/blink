import { getCurrentPrice } from "@app/prices"
import { BTC_NETWORK, getOnChainWalletConfig, ONCHAIN_SCAN_DEPTH_OUTGOING } from "@config"
import { checkedToSats, checkedToTargetConfs, toSats } from "@domain/bitcoin"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import { checkedToOnChainAddress, TxDecoder } from "@domain/bitcoin/onchain"
import {
  InsufficientBalanceError,
  LessThanDustThresholdError,
  RebalanceNeededError,
  SelfPaymentError,
} from "@domain/errors"
import { WithdrawalFeeCalculator, PaymentInputValidator } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { LockService } from "@services"
import { baseLogger } from "@services/logger"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { NotificationsService } from "@services/notifications"

import {
  checkAndVerifyTwoFA,
  checkIntraledgerLimits,
  checkWithdrawalLimits,
} from "./check-limit-helpers"
import { getOnChainFeeByWalletId } from "./get-on-chain-fee"

const { dustThreshold } = getOnChainWalletConfig()

export const payOnChainByWalletIdWithTwoFA = async ({
  senderAccount,
  senderWalletId,
  amount: amountRaw,
  address,
  targetConfirmations,
  memo,
  sendAll,
  twoFAToken,
}: PayOnChainByWalletIdWithTwoFAArgs): Promise<PaymentSendStatus | ApplicationError> => {
  const amount = sendAll
    ? await LedgerService().getWalletBalance(senderWalletId)
    : checkedToSats(amountRaw)
  if (amount instanceof Error) return amount

  const user = await UsersRepository().findById(senderAccount.ownerId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        walletId: senderWalletId,
        amount,
        twoFASecret: twoFA.secret,
        twoFAToken,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  return payOnChainByWalletId({
    senderAccount,
    senderWalletId,
    amount,
    address,
    targetConfirmations,
    memo,
    sendAll,
  })
}

export const payOnChainByWalletId = async ({
  senderAccount,
  senderWalletId,
  amount: amountRaw,
  address,
  targetConfirmations,
  memo,
  sendAll,
}: PayOnChainByWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  const checkedAmount = sendAll
    ? await LedgerService().getWalletBalance(senderWalletId)
    : checkedToSats(amountRaw)
  if (checkedAmount instanceof Error) return checkedAmount

  const validator = PaymentInputValidator(WalletsRepository().findById)
  const validationResult = await validator.validatePaymentInput({
    amount: checkedAmount,
    senderAccount,
    senderWalletId,
  })
  if (validationResult instanceof Error) return validationResult

  const { amount } = validationResult

  const onchainLogger = baseLogger.child({
    topic: "payment",
    protocol: "onchain",
    transactionType: "payment",
    address,
    amount,
    memo,
    sendAll,
  })
  const checkedAddress = checkedToOnChainAddress({
    network: BTC_NETWORK,
    value: address,
  })
  if (checkedAddress instanceof Error) return checkedAddress

  const checkedTargetConfirmations = checkedToTargetConfs(targetConfirmations)
  if (checkedTargetConfirmations instanceof Error) return checkedTargetConfirmations

  const wallets = WalletsRepository()
  const recipientWallet = await wallets.findByAddress(checkedAddress)
  const isIntraLedger = !(recipientWallet instanceof Error)

  if (isIntraLedger)
    return executePaymentViaIntraledger({
      senderAccount,
      senderWalletId,
      recipientWallet,
      amount,
      address: checkedAddress,
      memo,
      sendAll,
      logger: onchainLogger,
    })

  return executePaymentViaOnChain({
    senderWalletId,
    amount,
    address: checkedAddress,
    targetConfirmations: checkedTargetConfirmations,
    memo,
    sendAll,
    logger: onchainLogger,
  })
}

const executePaymentViaIntraledger = async ({
  senderAccount,
  senderWalletId,
  recipientWallet,
  amount,
  address,
  memo,
  sendAll,
  logger,
}: {
  senderAccount: Account
  senderWalletId: WalletId
  recipientWallet: Wallet
  amount: Satoshis
  address: OnChainAddress
  memo: string | null
  sendAll: boolean
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  if (recipientWallet.id === senderWalletId) return new SelfPaymentError()

  const intraledgerLimitCheck = await checkIntraledgerLimits({
    amount,
    walletId: senderWalletId,
  })
  if (intraledgerLimitCheck instanceof Error) return intraledgerLimitCheck

  const usdPerSat = await getCurrentPrice()
  if (usdPerSat instanceof Error) return usdPerSat

  const fee = toSats(0)
  const sats = toSats(amount + fee)
  const usd = sats * usdPerSat
  const usdFee = fee * usdPerSat

  const recipientAccount = await AccountsRepository().findById(recipientWallet.accountId)
  if (recipientAccount instanceof Error) return recipientAccount

  return LockService().lockWalletId(
    { walletId: senderWalletId, logger },
    async (lock) => {
      const balance = await LedgerService().getWalletBalance(senderWalletId)
      if (balance instanceof Error) return balance
      if (balance < sats)
        return new InsufficientBalanceError(
          `Payment amount '${sats}' exceeds balance '${balance}'`,
        )

      const onchainLoggerOnUs = logger.child({ balance, onUs: true })
      const journal = await LockService().extendLock(
        { logger: onchainLoggerOnUs, lock },
        async () =>
          LedgerService().addOnChainIntraledgerTxSend({
            senderWalletId,
            description: "",
            sats,
            fee,
            usd,
            usdFee,
            payeeAddresses: [address],
            sendAll,
            recipientWalletId: recipientWallet.id,
            senderUsername: senderAccount.username,
            recipientUsername: recipientAccount.username,
            memoPayer: memo ?? null,
          }),
      )
      if (journal instanceof Error) return journal

      const notificationsService = NotificationsService(logger)
      notificationsService.intraLedgerPaid({
        senderWalletId,
        recipientWalletId: recipientWallet.id,
        amount: sats,
        usdPerSat,
      })

      onchainLoggerOnUs.info(
        {
          success: true,
          type: "onchain_on_us",
          pending: false,
          fee,
          usd,
          usdFee,
        },
        "onchain payment succeed",
      )

      return PaymentSendStatus.Success
    },
  )
}

const executePaymentViaOnChain = async ({
  senderWalletId,
  amount,
  address,
  targetConfirmations,
  memo,
  sendAll,
  logger,
}: {
  senderWalletId: WalletId
  amount: Satoshis
  address: OnChainAddress
  targetConfirmations: TargetConfirmations
  memo: string | null
  sendAll: boolean
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const wallets = WalletsRepository()
  const ledgerService = LedgerService()
  const withdrawalFeeCalculator = WithdrawalFeeCalculator()

  const senderWallet = await wallets.findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const withdrawalLimitCheck = await checkWithdrawalLimits({
    amount,
    walletId: senderWalletId,
  })
  if (withdrawalLimitCheck instanceof Error) return withdrawalLimitCheck

  const estimatedFee = await getOnChainFeeByWalletId({
    walletId: senderWalletId,
    amount,
    address,
    targetConfirmations,
  })
  if (estimatedFee instanceof Error) return estimatedFee

  const amountToSend = sendAll ? toSats(amount - estimatedFee) : amount

  if (amountToSend < dustThreshold)
    return new LessThanDustThresholdError(
      `Use lightning to send amounts less than ${dustThreshold}`,
    )

  const onChainAvailableBalance = await onChainService.getBalance()
  if (onChainAvailableBalance instanceof Error) return onChainAvailableBalance
  if (onChainAvailableBalance < amountToSend + estimatedFee)
    return new RebalanceNeededError()

  const usdPerSat = await getCurrentPrice()
  if (usdPerSat instanceof Error) return usdPerSat

  const wallet = await WalletsRepository().findById(senderWalletId)
  if (wallet instanceof Error) return wallet

  const senderAccount = await AccountsRepository().findById(wallet.accountId)
  if (senderAccount instanceof Error) return senderAccount

  return LockService().lockWalletId(
    { walletId: senderWalletId, logger },
    async (lock) => {
      const balance = await LedgerService().getWalletBalance(senderWalletId)
      if (balance instanceof Error) return balance
      if (balance < amountToSend + estimatedFee)
        return new InsufficientBalanceError(
          `Payment amount '${amountToSend + estimatedFee}' exceeds balance '${balance}'`,
        )

      const journal = await LockService().extendLock({ logger, lock }, async () => {
        const txHash = await onChainService.payToAddress({
          address,
          amount: amountToSend,
          targetConfirmations,
        })
        if (txHash instanceof Error) {
          logger.error(
            { err: txHash, address, tokens: amountToSend, success: false },
            "Impossible to sendToChainAddress",
          )
          return txHash
        }

        let onChainTxFee = await onChainService.lookupOnChainFee({
          txHash,
          scanDepth: ONCHAIN_SCAN_DEPTH_OUTGOING,
        })

        if (onChainTxFee instanceof Error) {
          logger.fatal({ err: onChainTxFee }, "impossible to get fee for onchain payment")
          onChainTxFee = toSats(0)
        }

        const fee = onChainTxFee
          ? withdrawalFeeCalculator.onChainWithdrawalFee({
              onChainFee: onChainTxFee,
              walletFee: toSats(senderAccount.withdrawFee),
            })
          : estimatedFee
        const sats = toSats(amountToSend + fee)
        const usd = sats * usdPerSat
        const usdFee = fee * usdPerSat

        return ledgerService.addOnChainTxSend({
          walletId: senderWalletId,
          txHash,
          description: memo || "",
          sats,
          fee,
          bankFee: toSats(senderAccount.withdrawFee),
          usd,
          usdFee,
          payeeAddress: address,
          sendAll,
        })
      })
      if (journal instanceof Error) return journal

      return PaymentSendStatus.Success
    },
  )
}
