type LnInvoicePaymentSendArgs = {
  paymentRequest: EncodedPaymentRequest
  memo: string | null
  walletId: WalletId
  userId: UserId
  logger: Logger
}
type LnInvoicePaymentSendWithTwoFAArgs = LnInvoicePaymentSendArgs & {
  twoFAToken: TwoFAToken | null
}

type LnNoAmountInvoicePaymentSendArgs = LnInvoicePaymentSendArgs & { amount: Satoshis }
type LnNoAmountInvoicePaymentSendWithTwoFAArgs = LnNoAmountInvoicePaymentSendArgs & {
  twoFAToken: TwoFAToken | null
}
