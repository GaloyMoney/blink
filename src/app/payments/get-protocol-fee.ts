import { decodeInvoice } from "@domain/bitcoin/lightning"
import { checkedToWalletId } from "@domain/wallets"
import {
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  PriceRatio,
} from "@domain/payments"
import { LndService } from "@services/lnd"
import { PaymentFlowStateRepository } from "@services/payment-flow"
import { WalletsRepository } from "@services/mongoose"
import { NewDealerPriceService } from "@services/dealer-price"

import {
  constructPaymentFlowBuilder,
  newCheckIntraledgerLimits,
  newCheckWithdrawalLimits,
} from "./helpers"

export const getLightningFeeEstimation = async ({
  walletId,
  paymentRequest,
}: {
  walletId: string
  paymentRequest: EncodedPaymentRequest
}): Promise<PaymentAmount<WalletCurrency> | ApplicationError> => {
  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice
  if (decodedInvoice.paymentAmount === null) {
    return new LnPaymentRequestNonZeroAmountRequiredError()
  }

  return estimateLightningFee({
    uncheckedSenderWalletId: walletId,
    invoice: decodedInvoice,
  })
}

export const getNoAmountLightningFeeEstimation = async ({
  walletId,
  paymentRequest,
  amount,
}: {
  walletId: string
  paymentRequest: EncodedPaymentRequest
  amount: number
}): Promise<PaymentAmount<WalletCurrency> | ApplicationError> => {
  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { amount: lnInvoiceAmount } = decodedInvoice
  if (lnInvoiceAmount && lnInvoiceAmount > 0) {
    return new LnPaymentRequestZeroAmountRequiredError()
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
}): Promise<PaymentAmount<WalletCurrency> | ApplicationError> => {
  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const dealer = NewDealerPriceService()
  const builder = await constructPaymentFlowBuilder({
    senderWallet,
    invoice,
    uncheckedAmount,
    usdFromBtc: dealer.getCentsFromSatsForImmediateBuy,
    btcFromUsd: dealer.getSatsFromCentsForImmediateSell,
  })
  if (builder instanceof Error) return builder

  const usdPaymentAmount = await builder.usdPaymentAmount()
  if (usdPaymentAmount instanceof Error) return usdPaymentAmount
  const btcPaymentAmount = await builder.btcPaymentAmount()
  if (btcPaymentAmount instanceof Error) return btcPaymentAmount

  const priceRatio = PriceRatio({ usd: usdPaymentAmount, btc: btcPaymentAmount })
  if (priceRatio instanceof Error) return priceRatio

  let paymentFlow
  if (!(await builder.needsRoute())) {
    const limitCheck = await newCheckIntraledgerLimits({
      amount: usdPaymentAmount,
      wallet: senderWallet,
      priceRatio,
    })
    if (limitCheck instanceof Error) return limitCheck

    paymentFlow = await builder.withoutRoute()
  } else {
    const limitCheck = await newCheckWithdrawalLimits({
      amount: usdPaymentAmount,
      wallet: senderWallet,
      priceRatio,
    })
    if (limitCheck instanceof Error) return limitCheck

    const lndService = LndService()
    if (lndService instanceof Error) return lndService
    const routeResult = await lndService.findRouteForInvoice({
      invoice,
      amount: btcPaymentAmount,
    })
    if (routeResult instanceof Error) return routeResult

    paymentFlow = await builder.withRoute(routeResult)
  }
  if (paymentFlow instanceof Error) return paymentFlow

  const persistedPayment = await PaymentFlowStateRepository().persistNew(paymentFlow)
  if (persistedPayment instanceof Error) return persistedPayment

  return persistedPayment.protocolFeeInSenderWalletCurrency()
}
