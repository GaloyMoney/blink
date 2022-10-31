import { WalletCurrency } from "@domain/shared"
import { decodeInvoice, defaultTimeToExpiryInSeconds } from "@domain/bitcoin/lightning"
import { checkedToWalletId } from "@domain/wallets"
import {
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  SkipProbeForPubkeyError,
  PriceRatio,
} from "@domain/payments"
import { LndService } from "@services/lnd"

import { WalletsRepository, PaymentFlowStateRepository } from "@services/mongoose"
import { NewDealerPriceService } from "@services/dealer-price"
import { addAttributesToCurrentSpan } from "@services/tracing"

import { PartialResult } from "../partial-result"

import {
  constructPaymentFlowBuilder,
  newCheckIntraledgerLimits,
  newCheckTradeIntraAccountLimits,
  newCheckWithdrawalLimits,
} from "./helpers"

export const getLightningFeeEstimation = async ({
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

export const getNoAmountLightningFeeEstimation = async ({
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

  const dealer = NewDealerPriceService()
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

  const priceRatio = PriceRatio({ usd: usdPaymentAmount, btc: btcPaymentAmount })
  if (priceRatio instanceof Error) return PartialResult.err(priceRatio)

  let paymentFlow: PaymentFlow<WalletCurrency, WalletCurrency> | ApplicationError
  if (await builder.isTradeIntraAccount()) {
    const limitCheck = await newCheckTradeIntraAccountLimits({
      amount: usdPaymentAmount,
      wallet: senderWallet,
      priceRatio,
    })
    if (limitCheck instanceof Error) return PartialResult.err(limitCheck)

    paymentFlow = await builder.withoutRoute()
  } else if (await builder.isIntraLedger()) {
    const limitCheck = await newCheckIntraledgerLimits({
      amount: usdPaymentAmount,
      wallet: senderWallet,
      priceRatio,
    })
    if (limitCheck instanceof Error) return PartialResult.err(limitCheck)

    paymentFlow = await builder.withoutRoute()
  } else {
    const limitCheck = await newCheckWithdrawalLimits({
      amount: usdPaymentAmount,
      wallet: senderWallet,
      priceRatio,
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
        ? PartialResult.ok(paymentFlow.protocolFeeInSenderWalletCurrency())
        : PartialResult.partial(
            paymentFlow.protocolFeeInSenderWalletCurrency(),
            routeResult,
          )
    }

    paymentFlow = await builder.withRoute(routeResult)
  }
  if (paymentFlow instanceof Error) return PartialResult.err(paymentFlow)

  const persistedPayment = await PaymentFlowStateRepository(
    defaultTimeToExpiryInSeconds,
  ).persistNew(paymentFlow)
  if (persistedPayment instanceof Error)
    return PartialResult.partial(
      paymentFlow.protocolFeeInSenderWalletCurrency(),
      persistedPayment,
    )

  return PartialResult.ok(persistedPayment.protocolFeeInSenderWalletCurrency())
}
