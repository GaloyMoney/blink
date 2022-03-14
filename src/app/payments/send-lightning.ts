import { WalletCurrency } from "@domain/shared"
import {
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  CouldNotFindLightningPaymentFlowError,
  LightningPaymentFlowBuilder,
} from "@domain/payments"
import { checkedToWalletId } from "@domain/wallets"
import {
  decodeInvoice,
  LnAlreadyPaidError,
  LnFeeCalculator,
  LnPaymentPendingError,
  PaymentSendStatus,
} from "@domain/bitcoin/lightning"

import { LndService } from "@services/lnd"
import { WalletsRepository } from "@services/mongoose"
import { PaymentsRepository } from "@services/redis"

import { constructPaymentFlowBuilder } from "./helpers"

export const payInvoiceByWalletId = async ({
  paymentRequest,
  memo,
  senderWalletId: uncheckedSenderWalletId,
  senderAccount,
  logger,
}: {
  senderWalletId: string
  paymentRequest: EncodedPaymentRequest
  memo: string
  senderAccount: Account
  logger: Logger
}): Promise<PaymentSendStatus | ApplicationError> => {
  const senderWalletId = checkedToWalletId(uncheckedSenderWalletId)
  if (senderWalletId instanceof Error) return senderWalletId

  const decodedInvoice = decodeInvoice(paymentRequest)
  if (decodedInvoice instanceof Error) return decodedInvoice

  const { paymentAmount: lnInvoiceAmount } = decodedInvoice
  if (!(lnInvoiceAmount && lnInvoiceAmount.amount > 0n)) {
    return new LnPaymentRequestNonZeroAmountRequiredError()
  }

  const senderWallet = await WalletsRepository().findById(senderWalletId)
  if (senderWallet instanceof Error) return senderWallet

  let paymentFlow = await PaymentsRepository().findLightningPaymentFlow({
    walletId: senderWalletId,
    paymentHash: decodedInvoice.paymentHash,
    inputAmount: lnInvoiceAmount.amount,
  })

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  if (paymentFlow instanceof CouldNotFindLightningPaymentFlowError) {
    const builder = await constructPaymentFlowBuilder({
      senderWallet,
      invoice: decodedInvoice,
    })
    if (builder instanceof Error) return builder
    paymentFlow = await builder.withoutRoute()
  }
  if (paymentFlow instanceof Error) return paymentFlow

  // look up if payment flow exists
  // if not use builder
  return PaymentSendStatus.Success
}
