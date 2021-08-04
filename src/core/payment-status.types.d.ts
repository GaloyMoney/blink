type InvoiceLookupErrorType = "InvoiceLookupError"
type InvoiceLookupError = ErrorWithMessage<InvoiceLookupErrorType>

type PaymentStatusError = LnInvoiceDecodeError | InvoiceLookupError

type PaymentStatus = {
  paymentHash: PaymentHash
  status: "paid" | "pending"
}

type PaymentStatusChecker = {
  getStatus: () => ResultAsync<PaymentStatus, PaymentStatusError>
}
