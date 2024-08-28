import { payInvoiceByWalletId } from "./send-lightning"

import { LnurlPayService } from "@/services/lnurl-pay"
import { checkedToBtcPaymentAmount } from "@/domain/shared"
import { decodeInvoice } from "@/domain/bitcoin/lightning"

export const lnAddressPaymentSend = async ({
  senderWalletId,
  senderAccount,
  amount: uncheckedAmount,
  memo,
  lnAddress,
}: LnAddressPaymentSendArgs): Promise<PaymentSendResult | ApplicationError> => {
  const amount = checkedToBtcPaymentAmount(uncheckedAmount)

  if (amount instanceof Error) {
    return amount
  }

  const uncheckedPaymentRequest =
    await LnurlPayService().fetchInvoiceFromLnAddressOrLnurl({
      amount,
      lnAddressOrLnurl: lnAddress,
    })
  if (uncheckedPaymentRequest instanceof Error) {
    return uncheckedPaymentRequest
  }

  const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
  const resolvedMemo =
    decodedInvoice instanceof Error
      ? memo
      : decodedInvoice.description
        ? decodedInvoice.description
        : memo

  return payInvoiceByWalletId({
    uncheckedPaymentRequest,
    memo: resolvedMemo,
    senderWalletId,
    senderAccount,
  })
}

export const lnurlPaymentSend = async ({
  senderWalletId,
  senderAccount,
  amount: uncheckedAmount,
  memo,
  lnurl,
}: LnurlPaymentSendArgs): Promise<PaymentSendResult | ApplicationError> => {
  const amount = checkedToBtcPaymentAmount(uncheckedAmount)

  if (amount instanceof Error) {
    return amount
  }

  const uncheckedPaymentRequest =
    await LnurlPayService().fetchInvoiceFromLnAddressOrLnurl({
      amount,
      lnAddressOrLnurl: lnurl,
    })
  if (uncheckedPaymentRequest instanceof Error) {
    return uncheckedPaymentRequest
  }

  const decodedInvoice = decodeInvoice(uncheckedPaymentRequest)
  const resolvedMemo =
    decodedInvoice instanceof Error
      ? memo
      : decodedInvoice.description
        ? decodedInvoice.description
        : memo

  return payInvoiceByWalletId({
    uncheckedPaymentRequest,
    memo: resolvedMemo,
    senderWalletId,
    senderAccount,
  })
}
