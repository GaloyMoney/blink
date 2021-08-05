type LnInvoiceDecodeErrorType = "LnInvoiceDecodeError"
type LnInvoiceDecodeError = ErrorWithMessage<LnInvoiceDecodeErrorType>

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
