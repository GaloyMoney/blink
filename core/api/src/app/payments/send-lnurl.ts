import { payInvoiceByWalletId } from "./send-lightning"

import { LnurlPayService } from "@/services/lnurl-pay"
import { checkedToBtcPaymentAmount } from "@/domain/shared"

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

  const invoice = await LnurlPayService().fetchInvoiceFromLnAddressOrLnurl({
    amount,
    lnAddressOrLnurl: lnAddress,
  })

  if (invoice instanceof Error) {
    return invoice
  }

  return payInvoiceByWalletId({
    uncheckedPaymentRequest: invoice,
    memo,
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

  const invoice = await LnurlPayService().fetchInvoiceFromLnAddressOrLnurl({
    amount,
    lnAddressOrLnurl: lnurl,
  })

  if (invoice instanceof Error) {
    return invoice
  }

  return payInvoiceByWalletId({
    uncheckedPaymentRequest: invoice,
    memo,
    senderWalletId,
    senderAccount,
  })
}
