import { decodeInvoice } from "@domain/bitcoin/lightning"
import { checkedToWalletId } from "@domain/wallets"
import { LndService } from "@services/lnd"
import { PaymentsRepository } from "@services/redis"
import { WalletsRepository } from "@services/mongoose"
import {
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  LightningPaymentFlowBuilder,
} from "@domain/payments"
import { WalletCurrency } from "@domain/shared"
import { NewDealerPriceService } from "@services/dealer-price"

import { constructPaymentFlowBuilder } from "./helpers"

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
  if (decodedInvoice.paymentAmount === null) {
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

  const builder = await constructPaymentFlowBuilder({
    senderWallet,
    invoice,
    uncheckedAmount,
  })
  if (builder instanceof Error) return builder
  builder.btcPaymentAmount()

  let paymentFlow
  if (await builder.needsRoute()) {
    paymentFlow = await builder.withoutRoute()
  } else {
    const btcPaymentAmount = await builder.btcPaymentAmount()
    if (btcPaymentAmount instanceof Error) return btcPaymentAmount

    const lndService = LndService()
    if (lndService instanceof Error) return lndService
    const routeResult = await lndService.findRouteForInvoiceNew({
      invoice,
      amount: btcPaymentAmount,
    })
    if (routeResult instanceof Error) return routeResult

    paymentFlow = await builder.withRoute(routeResult)
  }
  if (paymentFlow instanceof Error) return paymentFlow

  const persistedPayment = await PaymentsRepository().persistNew(paymentFlow)
  if (persistedPayment instanceof Error) return persistedPayment

  return persistedPayment.protocolFeeInSenderWalletCurrency()
}
