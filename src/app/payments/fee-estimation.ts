import { decodeInvoice } from "@domain/bitcoin/lightning"
import { checkedToWalletId } from "@domain/wallets"
import { LndService } from "@services/lnd"
import { WalletsRepository, PaymentsRepository } from "@services/mongoose"
import {
  LightningPaymentBuilder,
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
} from "@domain/payments"
import { LedgerService } from "@services/ledger"
import {
  paymentAmountFromCents,
  paymentAmountFromSats,
  WalletCurrency,
} from "@domain/shared"

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

  const paymentBuilder = LightningPaymentBuilder({
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

  const paymentBuilder = LightningPaymentBuilder({
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
  paymentBuilder: LightningPaymentBuilder<"BTC">
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
  paymentBuilder: LightningPaymentBuilder<"USD">
}): Promise<PaymentAmount<"USD"> | ApplicationError> => {
  return {
    currency: WalletCurrency.Usd,
    amount: 0n,
  }
}
