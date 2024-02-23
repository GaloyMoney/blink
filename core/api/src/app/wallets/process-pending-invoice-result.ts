export const ProcessedReason = {
  InvoiceNotFound: "InvoiceNotFound",
  InvoiceCanceled: "InvoiceCanceled",
  InvoiceNotFoundOrCanceled: "InvoiceNotFoundOrCanceled",
} as const

export const ProcessPendingInvoiceResultType = {
  MarkProcessedAsPaidWithError: "markProcessedAsPaidWithError",
  MarkProcessedAsPaid: "markProcessedAsPaid",
  MarkProcessedAsCanceledOrExpired: "markProcessedAsCanceledOrExpired",
  ReasonInvoiceNotPaidYet: "reasonInvoiceNotPaidYet",
  Error: "error",
} as const

export const ProcessPendingInvoiceResult = {
  processAsPaid: (): ProcessPendingInvoiceResult => ({
    type: ProcessPendingInvoiceResultType.MarkProcessedAsPaid,
  }),
  processAsPaidWithError: (error: ApplicationError): ProcessPendingInvoiceResult => ({
    type: ProcessPendingInvoiceResultType.MarkProcessedAsPaidWithError,
    error,
  }),
  processAsCanceledOrExpired: (reason: ProcessedReason): ProcessPendingInvoiceResult => ({
    type: ProcessPendingInvoiceResultType.MarkProcessedAsCanceledOrExpired,
    reason,
  }),
  notPaid: (): ProcessPendingInvoiceResult => ({
    type: ProcessPendingInvoiceResultType.ReasonInvoiceNotPaidYet,
  }),
  err: (error: ApplicationError): ProcessPendingInvoiceResult => ({
    type: ProcessPendingInvoiceResultType.Error,
    error,
  }),
}
