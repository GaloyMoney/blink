export const ProcessedReason = {
  InvoiceNotFound: "InvoiceNotFound",
  InvoiceCanceled: "InvoiceCanceled",
  InvoiceNotPaidYet: "InvoiceNotPaidYet",
} as const

const wrapper = (
  state: ProcessPendingInvoiceResultState,
): ProcessPendingInvoiceResult => {
  return {
    _state: () => state,
    markProcessedAsCanceledOrExpired: () =>
      "markProcessedAsCanceledOrExpired" in state &&
      state.markProcessedAsCanceledOrExpired,
    markProcessedAsPaid: () =>
      "markProcessedAsPaid" in state && state.markProcessedAsPaid,
    error: () => ("error" in state && state.error ? state.error : false),
    reason: () => ("reason" in state && state.reason ? state.reason : false),
  }
}

export const ProcessPendingInvoiceResult = {
  processAsPaid: (): ProcessPendingInvoiceResult =>
    wrapper({
      markProcessedAsPaid: true,
    }),
  processAsPaidWithError: (error: ApplicationError): ProcessPendingInvoiceResult =>
    wrapper({
      markProcessedAsPaid: true,
      error,
    }),
  processAsCanceledOrExpired: (reason: ProcessedReason): ProcessPendingInvoiceResult =>
    wrapper({
      markProcessedAsCanceledOrExpired: true,
      reason,
    }),
  notPaid: (): ProcessPendingInvoiceResult =>
    wrapper({
      reason: ProcessedReason.InvoiceNotPaidYet,
    }),
  err: (error: ApplicationError): ProcessPendingInvoiceResult =>
    wrapper({
      error,
    }),
}
