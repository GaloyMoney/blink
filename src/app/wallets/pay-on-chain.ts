import { getUsernameFromWalletId } from "@app/accounts"
import { getCurrentPrice } from "@app/prices"
import { getUser } from "@app/users"
import {
  BTC_NETWORK,
  getOnChainWalletConfig,
  ONCHAIN_SCAN_DEPTH_OUTGOING,
} from "@config/app"
import { checkedToSats, checkedToTargetConfs, toSats } from "@domain/bitcoin"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import { checkedToOnChainAddress, TxDecoder } from "@domain/bitcoin/onchain"
import {
  InsufficientBalanceError,
  LessThanDustThresholdError,
  RebalanceNeededError,
  SelfPaymentError,
} from "@domain/errors"
import { WithdrawalFeeCalculator } from "@domain/wallets"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { LockService } from "@services/lock"
import { baseLogger } from "@services/logger"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { NotificationsService } from "@services/notifications"

import {
  checkAndVerifyTwoFA,
  checkIntraledgerLimits,
  checkWithdrawalLimits,
} from "./check-limit-helpers"
import { getBalanceForWalletId } from "./get-balance-for-wallet"
import { getOnChainFeeByWalletId } from "./get-on-chain-fee"

const { dustThreshold } = getOnChainWalletConfig()

export const payOnChainByWalletIdWithTwoFA = async ({
  senderWalletId,
  amount,
  address,
  targetConfirmations,
  memo,
  sendAll,
  payerAccountId,
  twoFAToken,
}: PayOnChainByWalletIdWithTwoFAArgs): Promise<PaymentSendStatus | ApplicationError> => {
  const checkedAmount = sendAll
    ? await getBalanceForWalletId(senderWalletId)
    : checkedToSats(amount)
  if (checkedAmount instanceof Error) return checkedAmount

  const account = await AccountsRepository().findById(payerAccountId)
  if (account instanceof Error) return account

  const user = await getUser(account.ownerId)
  if (user instanceof Error) return user
  const { twoFA } = user

  const twoFACheck = twoFA?.secret
    ? await checkAndVerifyTwoFA({
        walletId: senderWalletId,
        amount: checkedAmount,
        twoFASecret: twoFA.secret,
        twoFAToken,
      })
    : true
  if (twoFACheck instanceof Error) return twoFACheck

  return payOnChainByWalletId({
    senderWalletId,
    amount,
    address,
    targetConfirmations,
    memo,
    sendAll,
  })
}

export const payOnChainByWalletId = async ({
  senderWalletId,
  amount,
  address,
  targetConfirmations,
  memo,
  sendAll,
}: PayOnChainByWalletIdArgs): Promise<PaymentSendStatus | ApplicationError> => {
  const onchainLogger = baseLogger.child({
    topic: "payment",
    protocol: "onchain",
    transactionType: "payment",
    address,
    amount,
    memo,
  })
  const checkedAddress = checkedToOnChainAddress({
    network: BTC_NETWORK,
    value: address,
  })
  if (checkedAddress instanceof Error) return checkedAddress

  const checkedTargetConfirmations = checkedToTargetConfs(targetConfirmations)
  if (checkedTargetConfirmations instanceof Error) return checkedTargetConfirmations

  const checkedAmount = sendAll
    ? await getBalanceForWalletId(senderWalletId)
    : checkedToSats(amount)
  if (checkedAmount instanceof Error) return checkedAmount

  const wallets = WalletsRepository()
  const recipientWallet = await wallets.findByAddress(checkedAddress)
  const isIntraLedger = !(recipientWallet instanceof Error)

  if (isIntraLedger)
    return executePaymentViaIntraledger({
      senderWalletId,
      recipientWalletId: recipientWallet.id,
      amount: checkedAmount,
      address: checkedAddress,
      memo,
      sendAll,
      logger: onchainLogger,
    })

  return executePaymentViaOnChain({
    senderWalletId,
    amount: checkedAmount,
    address: checkedAddress,
    targetConfirmations: checkedTargetConfirmations,
    memo,
    sendAll,
    logger: onchainLogger,
  })
}

const executePaymentViaIntraledger = async ({
  senderWalletId,
  recipientWalletId,
  amount,
  address,
  memo,
  sendAll,
  logger,
}: {
  senderWalletId: WalletId
  recipientWalletId: WalletId
  amount: Satoshis
  address: OnChainAddress
  memo: string | null
  sendAll: boolean
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  if (recipientWalletId === senderWalletId) return new SelfPaymentError()

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

  const getUsername = async (walletId: WalletId) => {
    const username = await getUsernameFromWalletId(walletId)
    if (username instanceof Error) return null
    return username
  }

  const payerUsername = await getUsername(senderWalletId)
  const recipientUsername = await getUsername(recipientWalletId)

  return LockService().lockWalletId(
    { walletId: senderWalletId, logger },
    async (lock) => {
      const balance = await getBalanceForWalletId(senderWalletId)
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
            recipientWalletId,
            payerUsername,
            recipientUsername,
            memoPayer: memo || null,
          }),
      )
      if (journal instanceof Error) return journal

      const notificationsService = NotificationsService(logger)
      notificationsService.intraLedgerPaid({
        senderWalletId,
        recipientWalletId,
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
      const balance = await getBalanceForWalletId(senderWalletId)
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
