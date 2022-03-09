import { decodeInvoice } from "@domain/bitcoin/lightning"
import { checkedToWalletId } from "@domain/wallets"
import { LndService } from "@services/lnd"
import { WalletsRepository } from "@services/mongoose"
import {
  PaymentBuilder,
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  PaymentBuilderNotCompleteError,
} from "@domain/payments"
import { LedgerService } from "@services/ledger"
import { WalletCurrency } from "@domain/shared"

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

  const paymentBuilder = PaymentBuilder()
    .withPaymentRequest(paymentRequest)
    .withBtcPaymentAmount(decodedInvoice.paymentAmount)

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

  const paymentBuilder = PaymentBuilder().withAmountFromUnknownCurrencyAmount(amount)

  return estimateLightningFee({
    uncheckedSenderWalletId: walletId,
    decodedInvoice,
    paymentBuilder,
  })
}

const estimateLightningFee = async ({
  uncheckedSenderWalletId,
  decodedInvoice,
  paymentBuilder,
}: {
  uncheckedSenderWalletId: string
  decodedInvoice: LnInvoice
  paymentBuilder
}): Promise<PaymentAmount<WalletCurrency> | ApplicationError> => {
  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  let updatedPaymentBuilder = paymentBuilder.withSenderWallet(senderWallet)

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const isLocal = lndService.isLocal(decodedInvoice.destination)
  updatedPaymentBuilder = updatedPaymentBuilder.withCheckedIfLocal(isLocal)

  const payment = updatedPaymentBuilder.payment()
  if (!(payment instanceof Error)) {
    PaymentsRepository().persistNew(payment)
    return payment.feeAmount
  }

  return feeProbe({ decodedInvoice, paymentBuilder })
}

const feeProbe = async ({
  decodedInvoice,
  paymentBuilder,
}: {
  decodedInvoice: LnInvoice
  paymentBuilder
}): Promise<PaymentAmount<WalletCurrency> | ApplicationError> => {
  let payment = paymentBuilder.payment()
  if (payment instanceof Error) return payment

  const balance = await LedgerService().getWalletBalance(payment.senderWalletId)
  if (balance instanceof Error) return balance

  let updatedPaymentBuilder = paymentBuilder.withCheckedHasBalance(balance)
  payment = updatedPaymentBuilder.payment()
  if (payment instanceof Error && !(payment instanceof PaymentBuilderNotCompleteError)) {
    PaymentsRepository().persistNew(payment)
    return payment
  }

  return {
    amount: 1n,
    currency: WalletCurrency.Btc,
  }
}
