type LnInvoiceDecodeErrorType = "LnInvoiceDecodeError"
type LnInvoiceDecodeError = ErrorWithMessage<LnInvoiceDecodeErrorType>

type PaymentHash = {
  readonly inner: string
}

type PaymentSecret = {
  readonly inner: string
}

type LnInvoice = {
  readonly paymentHash: PaymentHash
  readonly paymentSecret: PaymentSecret
}
