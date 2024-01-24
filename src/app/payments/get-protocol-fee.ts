import { WalletCurrency } from "@domain/shared"
import { decodeInvoice, defaultTimeToExpiryInSeconds } from "@domain/bitcoin/lightning"
import { checkedToWalletId } from "@domain/wallets"
import {
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  SkipProbeForPubkeyError,
} from "@domain/payments"
import { LndService } from "@services/lnd"

import { WalletsRepository, PaymentFlowStateRepository } from "@services/mongoose"
import { DealerPriceService } from "@services/dealer-price"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { validateIsBtcWallet, validateIsUsdWallet } from "@app/wallets"

import { PartialResult } from "../partial-result"

import {
  constructPaymentFlowBuilder,
  checkIntraledgerLimits,
  checkTradeIntraAccountLimits,
  checkWithdrawalLimits,
  getPriceRatioForLimits,
} from "./helpers"

const getLightningFeeEstimation = async ({
  walletId,
  uncheckedPaymentRequest,
}: {
  walletId: string
  uncheckedPaymentRequest: string
}): Promise<PartialResult<PaymentAmount<WalletCurrency>>> => {
  const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
  if (decodedInvoice instanceof Error) return PartialResult.err(decodedInvoice)
  if (decodedInvoice.paymentAmount === null) {
    return PartialResult.err(new LnPaymentRequestNonZeroAmountRequiredError())
  }

  return estimateLightningFee({
    uncheckedSenderWalletId: walletId,
    invoice: decodedInvoice,
  })
}

export const getLightningFeeEstimationForBtcWallet = async (args: {
  walletId: string
  uncheckedPaymentRequest: string
}): Promise<PartialResult<PaymentAmount<WalletCurrency>>> => {
  const walletIdChecked = checkedToWalletId(args.walletId)
  if (walletIdChecked instanceof Error) return PartialResult.err(walletIdChecked)

  const validated = await validateIsBtcWallet(walletIdChecked)
  return validated instanceof Error
    ? PartialResult.err(validated)
    : getLightningFeeEstimation(args) // change to Ibex.getFeeEstimation
}

export const getLightningFeeEstimationForUsdWallet = async (args: {
  walletId: string
  uncheckedPaymentRequest: string
}): Promise<PartialResult<PaymentAmount<WalletCurrency>>> => {
  const walletIdChecked = checkedToWalletId(args.walletId)
  if (walletIdChecked instanceof Error) return PartialResult.err(walletIdChecked)

  const validated = await validateIsUsdWallet(walletIdChecked)
  return validated instanceof Error
    ? PartialResult.err(validated)
    : getLightningFeeEstimation(args)
}

const getNoAmountLightningFeeEstimation = async ({
  walletId,
  uncheckedPaymentRequest,
  amount,
}: {
  walletId: string
  uncheckedPaymentRequest: string
  amount: number
}): Promise<PartialResult<PaymentAmount<WalletCurrency>>> => {
  const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
  if (decodedInvoice instanceof Error) return PartialResult.err(decodedInvoice)

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount > 0) {
    return PartialResult.err(new LnPaymentRequestZeroAmountRequiredError())
  }

  return estimateLightningFee({
    uncheckedSenderWalletId: walletId,
    invoice: decodedInvoice,
    uncheckedAmount: amount,
  })
}

export const getNoAmountLightningFeeEstimationForBtcWallet = async (args: {
  walletId: string
  uncheckedPaymentRequest: string
  amount: number
}): Promise<PartialResult<PaymentAmount<WalletCurrency>>> => {
  const walletIdChecked = checkedToWalletId(args.walletId)
  if (walletIdChecked instanceof Error) return PartialResult.err(walletIdChecked)

  const validated = await validateIsBtcWallet(walletIdChecked)
  return validated instanceof Error
    ? PartialResult.err(validated)
    : getNoAmountLightningFeeEstimation(args)
}

export const getNoAmountLightningFeeEstimationForUsdWallet = async (args: {
  walletId: string
  uncheckedPaymentRequest: string
  amount: number
}): Promise<PartialResult<PaymentAmount<WalletCurrency>>> => {
  const walletIdChecked = checkedToWalletId(args.walletId)
  if (walletIdChecked instanceof Error) return PartialResult.err(walletIdChecked)

  const validated = await validateIsUsdWallet(walletIdChecked)
  return validated instanceof Error
    ? PartialResult.err(validated)
    : getNoAmountLightningFeeEstimation(args)
}

const estimateLightningFee = async ({
  uncheckedSenderWalletId,
  invoice,
  uncheckedAmount,
}: {
  uncheckedSenderWalletId: string
  invoice: LnInvoice
  uncheckedAmount?: number
}): Promise<PartialResult<PaymentAmount<WalletCurrency>>> => {
  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return PartialResult.err(senderWalletId)

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return PartialResult.err(senderWallet)

  const dealer = DealerPriceService()
  const builder = await constructPaymentFlowBuilder({
    senderWallet,
    invoice,
    uncheckedAmount,
    hedgeBuyUsd: {
      usdFromBtc: dealer.getCentsFromSatsForFutureBuy,
      btcFromUsd: dealer.getSatsFromCentsForFutureBuy,
    },
    hedgeSellUsd: {
      usdFromBtc: dealer.getCentsFromSatsForFutureSell,
      btcFromUsd: dealer.getSatsFromCentsForFutureSell,
    },
  })
  if (builder instanceof Error) return PartialResult.err(builder)

  const usdPaymentAmount = await builder.usdPaymentAmount()
  if (usdPaymentAmount instanceof Error) return PartialResult.err(usdPaymentAmount)
  const btcPaymentAmount = await builder.btcPaymentAmount()
  if (btcPaymentAmount instanceof Error) return PartialResult.err(btcPaymentAmount)

  addAttributesToCurrentSpan({
    "payment.amount": btcPaymentAmount.amount.toString(),
    "payment.request.destination": invoice.destination,
    "payment.request.hash": invoice.paymentHash,
    "payment.request.description": invoice.description,
    "payment.request.expiresAt": invoice.expiresAt
      ? invoice.expiresAt.toISOString()
      : "undefined",
  })

  const priceRatioForLimits = await getPriceRatioForLimits({
    usd: usdPaymentAmount,
    btc: btcPaymentAmount,
  })
  if (priceRatioForLimits instanceof Error) return PartialResult.err(priceRatioForLimits)

  let paymentFlow: PaymentFlow<WalletCurrency, WalletCurrency> | ApplicationError
  if (await builder.isTradeIntraAccount()) {
    const limitCheck = await checkTradeIntraAccountLimits({
      amount: usdPaymentAmount,
      accountId: senderWallet.accountId,
      priceRatio: priceRatioForLimits,
    })
    if (limitCheck instanceof Error) return PartialResult.err(limitCheck)

    paymentFlow = await builder.withoutRoute()
  } else if (await builder.isIntraLedger()) {
    const limitCheck = await checkIntraledgerLimits({
      amount: usdPaymentAmount,
      accountId: senderWallet.accountId,
      priceRatio: priceRatioForLimits,
    })
    if (limitCheck instanceof Error) return PartialResult.err(limitCheck)

    paymentFlow = await builder.withoutRoute()
  } else {
    const limitCheck = await checkWithdrawalLimits({
      amount: usdPaymentAmount,
      accountId: senderWallet.accountId,
      priceRatio: priceRatioForLimits,
    })
    if (limitCheck instanceof Error) return PartialResult.err(limitCheck)

    const lndService = LndService()
    if (lndService instanceof Error) {
      return PartialResult.err(lndService)
    }

    const routeResult = (await builder.skipProbeForDestination())
      ? new SkipProbeForPubkeyError()
      : await lndService.findRouteForInvoice({
          invoice,
          amount: btcPaymentAmount,
        })
    if (routeResult instanceof Error) {
      paymentFlow = await builder.withoutRoute()
      if (paymentFlow instanceof Error) {
        return PartialResult.err(paymentFlow)
      }

      PaymentFlowStateRepository(defaultTimeToExpiryInSeconds).persistNew(paymentFlow)
      return routeResult instanceof SkipProbeForPubkeyError
        ? PartialResult.ok(paymentFlow.protocolAndBankFeeInSenderWalletCurrency())
        : PartialResult.partial(
            paymentFlow.protocolAndBankFeeInSenderWalletCurrency(),
            routeResult,
          )
    }

    paymentFlow = await builder.withRoute(routeResult)
  }
  if (paymentFlow instanceof Error) return PartialResult.err(paymentFlow)

  addAttributesToCurrentSpan({
    "payment.finalRecipient": JSON.stringify(paymentFlow.recipientWalletDescriptor()),
  })

  const persistedPayment = await PaymentFlowStateRepository(
    defaultTimeToExpiryInSeconds,
  ).persistNew(paymentFlow)
  if (persistedPayment instanceof Error)
    return PartialResult.partial(
      paymentFlow.protocolAndBankFeeInSenderWalletCurrency(),
      persistedPayment,
    )

  return PartialResult.ok(persistedPayment.protocolAndBankFeeInSenderWalletCurrency())
}
