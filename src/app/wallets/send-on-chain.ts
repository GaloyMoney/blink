import crypto from "crypto"

import { BTC_NETWORK, getOnChainWalletConfig, ONCHAIN_SCAN_DEPTH_OUTGOING } from "@config"

import { getCurrentPrice } from "@app/prices"
import { btcFromUsdMidPriceFn, usdFromBtcMidPriceFn } from "@app/shared"
import { getPriceRatioForLimits, newCheckWithdrawalLimits } from "@app/payments/helpers"

import { PriceRatio } from "@domain/payments"
import { DisplayCurrency } from "@domain/fiat"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"
import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import { ResourceExpiredLockServiceError } from "@domain/lock"
import {
  DisplayCurrencyConverter,
  NewDisplayCurrencyConverter,
} from "@domain/fiat/display-currency"
import { checkedToSats, checkedToTargetConfs, toSats } from "@domain/bitcoin"
import { PaymentInputValidator } from "@domain/wallets"
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
import { OnChainPaymentFlowBuilder } from "@domain/payments/onchain-payment-flow-builder"

import * as LedgerFacade from "@services/ledger/facade"

import { NewDealerPriceService } from "@services/dealer-price"
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

import { checkIntraledgerLimits } from "./private/check-limit-helpers"
import { getOnChainFee } from "./get-on-chain-fee"

const { dustThreshold } = getOnChainWalletConfig()
const dealer = NewDealerPriceService()

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

  const withSenderBuilder = OnChainPaymentFlowBuilder({
    usdFromBtcMidPriceFn,
    btcFromUsdMidPriceFn,
    volumeLightningFn: LedgerService().lightningTxBaseVolumeSince,
    volumeOnChainFn: LedgerService().onChainTxBaseVolumeSince,
    isExternalAddress: async (address: OnChainAddress) => Promise.resolve(!!address),
    sendAll,
  })
    .withAddress(checkedAddress)
    .withSenderWalletAndAccount({
      wallet: senderWallet,
      account: senderAccount,
    })

  if (isIntraLedger) {
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
  }

  const builder = withSenderBuilder
    .withoutRecipientWallet()
    .withAmount(amount)
    .withConversion({
      usdFromBtc: dealer.getCentsFromSatsForImmediateSell,
      btcFromUsd: dealer.getSatsFromCentsForImmediateBuy,
    })

  return executePaymentViaOnChain({
    builder,
    senderAccount,
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

const executePaymentViaOnChain = async <
  S extends WalletCurrency,
  R extends WalletCurrency,
>({
  builder,
  senderAccount,
  targetConfirmations,
  memo,
  sendAll,
  logger,
}: {
  builder: OPFBWithConversion<S, R> | OPFBWithError
  senderAccount: Account
  targetConfirmations: TargetConfirmations
  memo: string | null
  sendAll: boolean
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const senderWalletDescriptor = await builder.senderWalletDescriptor()
  if (senderWalletDescriptor instanceof Error) return senderWalletDescriptor

  // TODO Usd use case
  if (senderWalletDescriptor.currency !== WalletCurrency.Btc) {
    return new NotImplementedError("USD Intraledger")
  }

  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  // Limit check
  const proposedAmounts = await builder.proposedAmounts()
  if (proposedAmounts instanceof Error) return proposedAmounts
  const amount = toSats(proposedAmounts.btc.amount)

  const priceRatioForLimits = await getPriceRatioForLimits(proposedAmounts)
  if (priceRatioForLimits instanceof Error) return priceRatioForLimits

  const limitCheck = await newCheckWithdrawalLimits({
    amount: proposedAmounts.usd,
    wallet: senderWalletDescriptor,
    priceRatio: priceRatioForLimits,
  })
  if (limitCheck instanceof Error) return limitCheck

  const address = await builder.addressForFlow()
  if (address instanceof Error) return address

  const getOnChainFeeArgs = {
    walletId: senderWalletDescriptor.id,
    account: senderAccount,
    amount,
    address,
    targetConfirmations,
  }

  // Get estimated miner fee and create 'paymentFlow'
  const minerFee = await onChainService.getOnChainFeeEstimate({
    amount,
    address,
    targetConfirmations,
  })
  if (minerFee instanceof Error) return minerFee
  const minerFeeAmount = paymentAmountFromNumber({
    amount: minerFee,
    currency: WalletCurrency.Btc,
  })
  if (minerFeeAmount instanceof Error) return minerFeeAmount

  const paymentFlow = await builder.withMinerFee(minerFeeAmount)
  if (paymentFlow instanceof Error) return paymentFlow

  // Check onchain balance & check if dust
  const onChainAvailableBalance = await onChainService.getBalance()
  if (onChainAvailableBalance instanceof Error) return onChainAvailableBalance

  const estimatedFee = await getOnChainFee(getOnChainFeeArgs)
  if (estimatedFee instanceof Error) return estimatedFee
  const estimatedFeeAmount = paymentAmountFromNumber({
    currency: WalletCurrency.Btc,
    amount: estimatedFee,
  })
  if (estimatedFeeAmount instanceof Error) return estimatedFeeAmount

  const totalAmounts = paymentFlow.totalAmountsForPayment()
  if (onChainAvailableBalance < totalAmounts.btc.amount) {
    return new RebalanceNeededError()
  }

  if (paymentFlow.btcPaymentAmount.amount < dustThreshold)
    return new LessThanDustThresholdError(
      `Use lightning to send amounts less than ${dustThreshold}`,
    )

  return LockService().lockWalletId(senderWalletDescriptor.id, async (signal) => {
    // Check user balance
    const balance = await LedgerService().getWalletBalance(senderWalletDescriptor.id)
    if (balance instanceof Error) return balance

    const estimatedFee = await getOnChainFee(getOnChainFeeArgs)
    if (estimatedFee instanceof Error) return estimatedFee

    if (balance < totalAmounts.btc.amount) {
      return new InsufficientBalanceError(
        `${totalAmounts.btc.amount} exceeds balance ${balance}`,
      )
    }

    // Check lock still intact
    if (signal.aborted) {
      return new ResourceExpiredLockServiceError(signal.error?.message)
    }

    const amountToSend = toSats(paymentFlow.btcPaymentAmount.amount)

    // Add fees to tracing
    // TODO: double-check if this needs to be re-calculated here
    const minerFee = await onChainService.getOnChainFeeEstimate({
      amount: amountToSend,
      address,
      targetConfirmations,
    })
    if (minerFee instanceof Error) return minerFee

    const bankFee = await paymentFlow.bankFees()
    if (bankFee instanceof Error) return bankFee
    const btcBankFee = bankFee.btc

    const btcTotalFee = await paymentFlow.btcProtocolFee
    if (btcTotalFee instanceof Error) return btcTotalFee

    addAttributesToCurrentSpan({
      "payOnChainByWalletId.estimatedFee": `${estimatedFee}`,
      "payOnChainByWalletId.estimatedMinerFee": `${minerFee}`,
      "payOnChainByWalletId.totalFee": `${btcTotalFee}`,
      "payOnChainByWalletId.bankFee": `${btcBankFee}`,
    })

    // Construct metadata
    const priceRatio = PriceRatio({
      usd: paymentFlow.usdPaymentAmount,
      btc: paymentFlow.btcPaymentAmount,
    })
    if (priceRatio instanceof Error) return priceRatio
    const displayCentsPerSat = priceRatio.usdPerSat()

    const converter = NewDisplayCurrencyConverter(displayCentsPerSat)

    const metadata = LedgerFacade.OnChainSendLedgerMetadata({
      // we need a temporary hash to be able to search in admin panel
      onChainTxHash: crypto.randomBytes(32).toString("hex") as OnChainTxHash,
      paymentFlow,

      amountDisplayCurrency: converter.fromUsdAmount(paymentFlow.usdPaymentAmount),
      feeDisplayCurrency: converter.fromUsdAmount(paymentFlow.usdProtocolFee),
      displayCurrency: DisplayCurrency.Usd,

      payeeAddresses: [address],
      sendAll,
    })

    // Record transaction
    const journal = await LedgerFacade.recordSend({
      description: memo || "",
      amountToDebitSender: {
        btc: {
          currency: paymentFlow.btcPaymentAmount.currency,
          amount: paymentFlow.btcPaymentAmount.amount + paymentFlow.btcProtocolFee.amount,
        },
        usd: {
          currency: paymentFlow.usdPaymentAmount.currency,
          amount: paymentFlow.usdPaymentAmount.amount + paymentFlow.usdProtocolFee.amount,
        },
      },
      bankFee,
      senderWalletDescriptor: paymentFlow.senderWalletDescriptor(),
      metadata,
    })
    if (journal instanceof Error) return journal

    // Execute payment onchain
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
      const reverted = await LedgerService().revertOnChainPayment({
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

    // Reconcile transaction in ledger on successful execution
    const updated = await LedgerService().setOnChainTxSendHash({
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
