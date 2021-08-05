type InvoiceLookupErrorType = "InvoiceLookupError"
type InvoiceLookupError = ErrorWithMessage<InvoiceLookupErrorType>

type PaymentStatusError = LnInvoiceDecodeError | InvoiceLookupError

type PaymentStatus = "paid" | "pending"

type PaymentStatusChecker = {
  paymentHash: PaymentHash
  getStatus: () => ResultAsync<PaymentStatus, PaymentStatusError>
}
