type LnInvoiceDecodeError = {
  message: string
}

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
