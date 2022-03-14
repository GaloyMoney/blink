import {
  LnPaymentRequestNonZeroAmountRequiredError,
  LnPaymentRequestZeroAmountRequiredError,
  CouldNotFindLightningPaymentFlowError,
  LightningPaymentFlowBuilderOld,
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

  const paymentFlow = await PaymentsRepository().findLightningPaymentFlow({
    walletId: senderWalletId,
    paymentHash: decodedInvoice.paymentHash,
    inputAmount: lnInvoiceAmount.amount,
  })

  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  let builder: LightningPaymentFlowBuilderOld<WalletCurrency> | undefined
  if (paymentFlow instanceof CouldNotFindLightningPaymentFlowError) {
    const senderWallet = await WalletsRepository().findById(senderWalletId)
    if (senderWallet instanceof Error) return senderWallet

    builder = LightningPaymentFlowBuilderOld({
      localNodeIds: lndService.listAllPubkeys(),
    })
      .withSenderWallet(senderWallet)
      .withInvoice(decodedInvoice)
  } else {
    builder = LightningPaymentFlowBuilderOld({
      localNodeIds: lndService.listAllPubkeys(),
      ...paymentFlow,
    })
  }

  // look up if payment flow exists
  // if not use builder
  return PaymentSendStatus.Success
}
