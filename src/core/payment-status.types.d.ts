type InvoiceLookupErrorType = "InvoiceLookupError"
type InvoiceLookupError = ErrorWithMessage<InvoiceLookupErrorType>

type PaymentStatus = "paid" | "pending"

type PaymentStatusChecker = {
  readonly paymentHash: PaymentHash
  readonly getStatus: () => ResultAsync<PaymentStatus, InvoiceLookupError>
}
