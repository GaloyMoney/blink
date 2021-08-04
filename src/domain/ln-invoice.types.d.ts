type LnInvoiceDecodeErrorType = "LnInvoiceDecodeError"
type LnInvoiceDecodeError = ErrorWithMessage<LnInvoiceDecodeError>

type PaymentHash = {
  inner: string
}

type PaymentSecret = {
  inner: string
}

type LnInvoice = {
  paymentHash: PaymentHash
  paymentSecret: PaymentSecret
}
