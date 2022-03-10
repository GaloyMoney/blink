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
  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice
  if (decodedInvoice.paymentAmount === null) {
    return new LnPaymentRequestNonZeroAmountRequiredError()
  }

  const paymentBuilder = LightningPaymentBuilder().withInvoice(decodedInvoice)

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

  const paymentBuilder = LightningPaymentBuilder()
    .withInvoice(decodedInvoice)
    .withUncheckedAmount(amount)

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

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const isLocal = lndService.isLocal(decodedInvoice.destination)
  if (isLocal instanceof Error) return isLocal

  const paymentBuilder = initialPaymentBuilder
    .withSenderWallet(senderWallet)
    .withPaymentRequest(decodedInvoice.paymentRequest)
    .withIsLocal(isLocal)

  return {
    amount: 0n,
    currency: WalletCurrency.Btc,
  }
}
