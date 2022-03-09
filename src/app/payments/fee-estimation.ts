import { decodeInvoice } from "@domain/bitcoin/lightning"
import { checkedToWalletId } from "@domain/wallets"
import { LndService } from "@services/lnd"
import { WalletCurrency, ZERO_SATS } from "@domain/shared"
import { WalletsRepository } from "@services/mongoose"
import {
  checkedToBtcPaymentAmount,
  checkedToUsdPaymentAmount,
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
} from "@domain/payments"

export const getLightningFeeEstimation = async ({
  walletId: uncheckedSenderWalletId,
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

  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  const payment = {
    senderWalletId,
    senderWalletCurrency: senderWallet.currency,
    btcPaymentAmount: decodedInvoice.paymentAmount,
  }

  return estimateLightningFee({
    senderWallet,
    decodedInvoice,
    payment,
  })
}

export const getNoAmountLightningFeeEstimation = async ({
  walletId: uncheckedSenderWalletId,
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

  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  let payment: Payment = {
    senderWalletId,
    senderWalletCurrency: senderWallet.currency,
  }

  if (payment.senderWalletCurrency === WalletCurrency.Btc) {
    const paymentAmount = checkedToBtcPaymentAmount(amount)
    if (paymentAmount instanceof Error) return paymentAmount
    payment = {
      ...payment,
      btcPaymentAmount: paymentAmount,
    }
  } else {
    const paymentAmount = checkedToUsdPaymentAmount(amount)
    if (paymentAmount instanceof Error) return paymentAmount
    payment = {
      ...payment,
      usdPaymentAmount: paymentAmount,
    }
  }

  return estimateLightningFee({
    senderWallet,
    decodedInvoice,
    payment,
  })
}

const estimateLightningFee = async ({
  senderWallet,
  decodedInvoice,
  payment,
}: {
  senderWallet: Wallet
  decodedInvoice: LnInvoice
  payment: Payment
}) => {
  const lndService = LndService()
  if (lndService instanceof Error) return lndService
  if (lndService.isLocal(decodedInvoice.destination)) {
    return ZERO_SATS
  }

  return {
    currency: WalletCurrency.Btc,
    amount: 0n,
  }
}
