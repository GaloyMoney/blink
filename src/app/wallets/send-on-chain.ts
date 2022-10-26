import crypto from "crypto"

import {
  BTC_NETWORK,
  getFeesConfig,
  getOnChainWalletConfig,
  ONCHAIN_SCAN_DEPTH_OUTGOING,
} from "@config"

import { getCurrentPrice } from "@app/prices"

import { DisplayCurrency } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import { ResourceExpiredLockServiceError } from "@domain/lock"
import { DisplayCurrencyConverter } from "@domain/fiat/display-currency"
import { ImbalanceCalculator } from "@domain/ledger/imbalance-calculator"
import { checkedToSats, checkedToTargetConfs, toSats } from "@domain/bitcoin"
import { PaymentInputValidator, WithdrawalFeeCalculator } from "@domain/wallets"
import {
  InsufficientBalanceError,
  LessThanDustThresholdError,
  NotImplementedError,
  RebalanceNeededError,
  SelfPaymentError,
} from "@domain/errors"
import {
  checkedToOnChainAddress,
  CPFPAncestorLimitReachedError,
  InsufficientOnChainFundsError,
  TxDecoder,
} from "@domain/bitcoin/onchain"

import { LockService } from "@services/lock"
import { baseLogger } from "@services/logger"
import { LedgerService } from "@services/ledger"
import { OnChainService } from "@services/lnd/onchain-service"
import { addAttributesToCurrentSpan } from "@services/tracing"
import { NotificationsService } from "@services/notifications"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"

import {
  checkIntraledgerLimits,
  checkWithdrawalLimits,
} from "./private/check-limit-helpers"
import { getOnChainFee } from "./get-on-chain-fee"

const { dustThreshold } = getOnChainWalletConfig()

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

  const { amount, senderWallet } = validationResult

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
      senderWallet,
      recipientWallet,
      amount,
      address: checkedAddress,
      memo,
      sendAll,
      logger: onchainLogger,
    })

  return executePaymentViaOnChain({
    senderWallet,
    senderAccount,
    amount,
    address: checkedAddress,
    targetConfirmations: checkedTargetConfirmations,
    memo,
    sendAll,
    logger: onchainLogger,
  })
}

const executePaymentViaIntraledger = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  senderAccount,
  senderWallet,
  recipientWallet,
  amount,
  address,
  memo,
  sendAll,
  logger,
}: {
  senderAccount: Account
  senderWallet: WalletDescriptor<S>
  recipientWallet: WalletDescriptor<R>
  amount: CurrencyBaseAmount
  address: OnChainAddress
  memo: string | null
  sendAll: boolean
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  if (recipientWallet.id === senderWallet.id) return new SelfPaymentError()

  // TODO Usd use case
  if (
    !(
      recipientWallet.currency === WalletCurrency.Btc &&
      senderWallet.currency === WalletCurrency.Btc
    )
  ) {
    return new NotImplementedError("USD intraledger")
  }
  const amountSats = toSats(amount)

  const displayCurrencyPerSat = await getCurrentPrice()
  if (displayCurrencyPerSat instanceof Error) return displayCurrencyPerSat

  const dCConverter = DisplayCurrencyConverter(displayCurrencyPerSat)

  const intraledgerLimitCheck = await checkIntraledgerLimits({
    amount,
    dCConverter,
    walletId: senderWallet.id,
    walletCurrency: senderWallet.currency,
    account: senderAccount,
  })
  if (intraledgerLimitCheck instanceof Error) return intraledgerLimitCheck

  const amountDisplayCurrency = dCConverter.fromSats(amountSats)

  const recipientAccount = await AccountsRepository().findById(recipientWallet.accountId)
  if (recipientAccount instanceof Error) return recipientAccount

  return LockService().lockWalletId(senderWallet.id, async (signal) => {
    const balance = await LedgerService().getWalletBalance(senderWallet.id)
    if (balance instanceof Error) return balance
    if (balance < amount)
      return new InsufficientBalanceError(
        `Payment amount '${amount}' exceeds balance '${balance}'`,
      )

    const onchainLoggerOnUs = logger.child({ balance, onUs: true })

    if (signal.aborted) {
      return new ResourceExpiredLockServiceError(signal.error?.message)
    }

    const journal = await LedgerService().addOnChainIntraledgerTxTransfer({
      senderWalletId: senderWallet.id,
      senderWalletCurrency: senderWallet.currency,
      senderUsername: senderAccount.username,
      description: "",
      sats: amountSats,
      amountDisplayCurrency,
      payeeAddresses: [address],
      sendAll,
      recipientWalletId: recipientWallet.id,
      recipientWalletCurrency: recipientWallet.currency,
      recipientUsername: recipientAccount.username,
      memoPayer: memo || undefined,
    })

    if (journal instanceof Error) return journal

    const recipientUser = await UsersRepository().findById(recipientAccount.ownerId)
    if (recipientUser instanceof Error) return recipientUser

    const displayPaymentAmount: DisplayPaymentAmount<DisplayCurrency> = {
      amount: amountDisplayCurrency,
      currency: DisplayCurrency.Usd,
    }

    const notificationsService = NotificationsService()
    notificationsService.intraLedgerTxReceived({
      recipientAccountId: recipientWallet.accountId,
      recipientWalletId: recipientWallet.id,
      recipientDeviceTokens: recipientUser.deviceTokens,
      recipientLanguage: recipientUser.language,
      paymentAmount: { amount: BigInt(amountSats), currency: recipientWallet.currency },
      displayPaymentAmount,
    })

    onchainLoggerOnUs.info(
      {
        success: true,
        type: "onchain_on_us",
        pending: false,
        amountDisplayCurrency,
      },
      "onchain payment succeed",
    )

    return PaymentSendStatus.Success
  })
}

const executePaymentViaOnChain = async ({
  senderWallet,
  senderAccount,
  amount,
  address,
  targetConfirmations,
  memo,
  sendAll,
  logger,
}: {
  senderWallet: Wallet
  senderAccount: Account
  amount: CurrencyBaseAmount
  address: OnChainAddress
  targetConfirmations: TargetConfirmations
  memo: string | null
  sendAll: boolean
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  // TODO Usd use case
  if (senderWallet.currency !== WalletCurrency.Btc) {
    return new NotImplementedError("USD Intraledger")
  }

  const amountSats = toSats(amount)

  const ledgerService = LedgerService()

  const feeConfig = getFeesConfig()

  const withdrawFeeCalculator = WithdrawalFeeCalculator({
    feeRatio: feeConfig.withdrawRatio,
    thresholdImbalance: feeConfig.withdrawThreshold,
  })

  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const displayCurrencyPerSat = await getCurrentPrice()
  if (displayCurrencyPerSat instanceof Error) return displayCurrencyPerSat

  const dCConverter = DisplayCurrencyConverter(displayCurrencyPerSat)

  const withdrawalLimitCheck = await checkWithdrawalLimits({
    amount,
    dCConverter,
    walletId: senderWallet.id,
    walletCurrency: senderWallet.currency,
    account: senderAccount,
  })
  if (withdrawalLimitCheck instanceof Error) return withdrawalLimitCheck

  const getFeeEstimate = () =>
    getOnChainFee({
      walletId: senderWallet.id,
      account: senderAccount,
      amount,
      address,
      targetConfirmations,
    })

  const onChainAvailableBalance = await onChainService.getBalance()
  if (onChainAvailableBalance instanceof Error) return onChainAvailableBalance

  const estimatedFee = await getFeeEstimate()
  if (estimatedFee instanceof Error) return estimatedFee

  const amountToSend = sendAll ? toSats(amount - estimatedFee) : amountSats
  if (onChainAvailableBalance < amountToSend + estimatedFee)
    return new RebalanceNeededError()

  if (amountToSend < dustThreshold)
    return new LessThanDustThresholdError(
      `Use lightning to send amounts less than ${dustThreshold}`,
    )

  return LockService().lockWalletId(senderWallet.id, async (signal) => {
    const balance = await LedgerService().getWalletBalance(senderWallet.id)
    if (balance instanceof Error) return balance
    const estimatedFee = await getFeeEstimate()
    if (estimatedFee instanceof Error) return estimatedFee
    if (balance < amountToSend + estimatedFee) {
      return new InsufficientBalanceError(
        `${amountToSend + estimatedFee} exceeds balance ${balance}`,
      )
    }

    if (signal.aborted) {
      return new ResourceExpiredLockServiceError(signal.error?.message)
    }

    const imbalanceCalculator = ImbalanceCalculator({
      method: feeConfig.withdrawMethod,
      volumeLightningFn: LedgerService().lightningTxBaseVolumeSince,
      volumeOnChainFn: LedgerService().onChainTxBaseVolumeSince,
      sinceDaysAgo: feeConfig.withdrawDaysLookback,
    })

    const imbalance = await imbalanceCalculator.getSwapOutImbalance(senderWallet.id)
    if (imbalance instanceof Error) return imbalance

    const minerFee = await onChainService.getOnChainFeeEstimate({
      amount: amountToSend,
      address,
      targetConfirmations,
    })
    if (minerFee instanceof Error) return minerFee

    const fees = withdrawFeeCalculator.onChainWithdrawalFee({
      amount: amountToSend,
      minerFee,
      minBankFee: toSats(senderAccount.withdrawFee || feeConfig.withdrawDefaultMin),
      imbalance,
    })

    const totalFee = fees.totalFee
    const bankFee = fees.bankFee
    const sats = toSats(amountToSend + totalFee)
    const amountDisplayCurrency = dCConverter.fromSats(sats)
    const totalFeeDisplayCurrency = dCConverter.fromSats(totalFee)

    addAttributesToCurrentSpan({
      "payOnChainByWalletId.estimatedFee": `${estimatedFee}`,
      "payOnChainByWalletId.estimatedMinerFee": `${minerFee}`,
      "payOnChainByWalletId.totalFee": `${totalFee}`,
      "payOnChainByWalletId.bankFee": `${bankFee}`,
    })

    const journal = await ledgerService.addOnChainTxSend({
      walletId: senderWallet.id,
      walletCurrency: senderWallet.currency,
      // we need a temporary hash to be able to search in admin panel
      txHash: crypto.randomBytes(32).toString("hex") as OnChainTxHash,
      description: memo || "",
      sats,
      totalFee,
      bankFee,
      amountDisplayCurrency,
      payeeAddress: address,
      sendAll,
      totalFeeDisplayCurrency,
    })
    if (journal instanceof Error) return journal

    const txHash = await onChainService.payToAddress({
      address,
      amount: amountToSend,
      targetConfirmations,
      description: `journal-${journal.journalId}`,
    })
    if (
      txHash instanceof InsufficientOnChainFundsError ||
      txHash instanceof CPFPAncestorLimitReachedError
    ) {
      const reverted = await ledgerService.revertOnChainPayment({
        journalId: journal.journalId,
      })
      if (reverted instanceof Error) return reverted
      return txHash
    }
    if (txHash instanceof Error) {
      logger.error(
        { err: txHash, address, tokens: amountToSend, success: false },
        "Impossible to sendToChainAddress",
      )
      return txHash
    }

    const updated = await ledgerService.setOnChainTxSendHash({
      journalId: journal.journalId,
      newTxHash: txHash,
    })
    if (updated instanceof Error) return updated

    const finalMinerFee = await onChainService.lookupOnChainFee({
      txHash,
      scanDepth: ONCHAIN_SCAN_DEPTH_OUTGOING,
    })
    if (finalMinerFee instanceof Error) {
      logger.error({ err: finalMinerFee }, "impossible to get fee for onchain payment")
      addAttributesToCurrentSpan({
        "payOnChainByWalletId.errorGettingMinerFee": true,
      })
    }

    addAttributesToCurrentSpan({
      "payOnChainByWalletId.actualMinerFee": `${finalMinerFee}`,
    })

    return PaymentSendStatus.Success
  })
}
