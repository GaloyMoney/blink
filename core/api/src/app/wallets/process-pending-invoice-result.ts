export const ProcessedReason = {
  InvoiceNotFound: "InvoiceNotFound",
  InvoiceCanceled: "InvoiceCanceled",
} as const

const wrapper = (
  state: ProcessPendingInvoiceResultState,
): ProcessPendingInvoiceResult => {
  return {
    markProcessedOnly: () => "markProcessedOnly" in state && state.markProcessedOnly,
    markProcessedAndPaid: () => state.markProcessedAndPaid,
    error: () => ("error" in state && state.error ? state.error : false),
  }
}

export const ProcessPendingInvoiceResult = {
  ok: (): ProcessPendingInvoiceResult =>
    wrapper({
      markProcessedAndPaid: true,
    }),
  paidWithError: (error: ApplicationError): ProcessPendingInvoiceResult =>
    wrapper({
      markProcessedAndPaid: true,
      error,
    }),
  processedOnly: (reason: ProcessedReason): ProcessPendingInvoiceResult =>
    wrapper({
      markProcessedOnly: true,
      markProcessedAndPaid: false,
      reason,
    }),
  notPaid: (): ProcessPendingInvoiceResult =>
    wrapper({
      markProcessedOnly: false,
      markProcessedAndPaid: false,
    }),
  err: (error: ApplicationError): ProcessPendingInvoiceResult =>
    wrapper({
      markProcessedOnly: false,
      markProcessedAndPaid: false,
      error,
    }),
}
