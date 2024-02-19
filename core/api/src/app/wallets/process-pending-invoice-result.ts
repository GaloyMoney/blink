export const ProcessedReason = {
  InvoiceNotFound: "InvoiceNotFound",
  InvoiceCanceled: "InvoiceCanceled",
} as const

const wrapper = (
  state: ProcessPendingInvoiceResultState,
): ProcessPendingInvoiceResult => {
  return {
    markProcessedAsCanceledOrExpired: () =>
      "markProcessedAsCanceledOrExpired" in state &&
      state.markProcessedAsCanceledOrExpired,
    markProcessedAsPaid: () => state.markProcessedAsPaid,
    error: () => ("error" in state && state.error ? state.error : false),
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
      markProcessedAsPaid: false,
      reason,
    }),
  notPaid: (): ProcessPendingInvoiceResult =>
    wrapper({
      markProcessedAsCanceledOrExpired: false,
      markProcessedAsPaid: false,
    }),
  err: (error: ApplicationError): ProcessPendingInvoiceResult =>
    wrapper({
      markProcessedAsCanceledOrExpired: false,
      markProcessedAsPaid: false,
      error,
    }),
}
