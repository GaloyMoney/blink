import { decodeInvoice } from "@domain/bitcoin/lightning"
import { checkedToWalletId } from "@domain/wallets"
import { LndService } from "@services/lnd"
import { WalletsRepository, PaymentsRepository } from "@services/mongoose"
import {
  LightningPaymentFlowBuilder,
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  AmountConverter,
} from "@domain/payments"
import { WalletCurrency } from "@domain/shared"
import { NewDealerPriceService } from "@services/dealer-price"

export const getLightningFeeEstimation = async ({
  walletId,
  paymentRequest,
}: {
  walletId: string
  paymentRequest: EncodedPaymentRequest
}): Promise<PaymentAmount<WalletCurrency> | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice
  if (decodedInvoice.paymentAmount === null) {
    return new LnPaymentRequestNonZeroAmountRequiredError()
  }

  const paymentBuilder = LightningPaymentFlowBuilder({
    localNodeIds: lndService.listAllPubkeys(),
  })

  return estimateLightningFee({
    uncheckedSenderWalletId: walletId,
    decodedInvoice,
    paymentBuilder,
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

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const paymentBuilder = LightningPaymentFlowBuilder({
    localNodeIds: lndService.listAllPubkeys(),
  }).withUncheckedAmount(amount)

  return estimateLightningFee({
    uncheckedSenderWalletId: walletId,
    decodedInvoice,
    paymentBuilder,
  })
}

const estimateLightningFee = async ({
  uncheckedSenderWalletId,
  decodedInvoice,
  paymentBuilder: initialPaymentBuilder,
}: {
  uncheckedSenderWalletId: string
  decodedInvoice: LnInvoice
  paymentBuilder
}): Promise<PaymentAmount<WalletCurrency> | ApplicationError> => {
  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const paymentBuilder = initialPaymentBuilder
    .withSenderWallet(senderWallet)
    .withInvoice(decodedInvoice)

  if (!paymentBuilder.needsFeeCalculation()) {
    const payment = paymentBuilder.payment()
    if (payment instanceof Error) return payment

    const persistedPayment = await PaymentsRepository().persistNew(payment)
    if (persistedPayment instanceof Error) return persistedPayment

    return persistedPayment.protocolFeeInSenderWalletCurrency()
  }

  if (senderWallet.currency == WalletCurrency.Btc) {
    return estimateLightningFeeForBtcWallet({ decodedInvoice, paymentBuilder })
  }

  return estimateLightningFeeForUsdWallet({ decodedInvoice, paymentBuilder })
}

const estimateLightningFeeForBtcWallet = async ({
  decodedInvoice,
  paymentBuilder,
}: {
  decodedInvoice: LnInvoice
  paymentBuilder: LightningPaymentFlowBuilder<"BTC">
}): Promise<PaymentAmount<"BTC"> | ApplicationError> => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const routeResult = await lndService.findRouteForInvoiceNew({ decodedInvoice })
  if (routeResult instanceof Error) return routeResult

  const payment = paymentBuilder.withRouteResult(routeResult).payment()
  if (payment instanceof Error) return payment

  const persistedPayment = await PaymentsRepository().persistNew(payment)
  if (persistedPayment instanceof Error) return persistedPayment

  return persistedPayment.protocolFeeInSenderWalletCurrency()
}

const estimateLightningFeeForUsdWallet = async ({
  decodedInvoice,
  paymentBuilder,
}: {
  decodedInvoice: LnInvoice
  paymentBuilder: LightningPaymentFlowBuilder<"USD">
}): Promise<PaymentAmount<"USD"> | ApplicationError> => {
  const builder = await AmountConverter({
    dealerFns: NewDealerPriceService(),
  }).addAmountsForFutureBuy(paymentBuilder)
  if (builder instanceof Error) return builder

  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  const routeResult = await lndService.findRouteForInvoiceNew({
    decodedInvoice,
    amount: builder.btcPaymentAmount(),
  })
  if (routeResult instanceof Error) return routeResult

  const payment = paymentBuilder.withRouteResult(routeResult).payment()
  if (payment instanceof Error) return payment

  const persistedPayment = await PaymentsRepository().persistNew(payment)
  if (persistedPayment instanceof Error) return persistedPayment

  return persistedPayment.protocolFeeInSenderWalletCurrency()
}
