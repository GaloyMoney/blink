export const ProcessedReason = {
  InvoiceNotFound: "InvoiceNotFound",
  InvoiceCanceled: "InvoiceCanceled",
} as const

export const ProcessPendingInvoiceResult = {
  ok: (): ProcessPendingInvoiceResult => ({
    isProcessed: true,
    isPaid: true,
  }),
  paidOnly: (): ProcessPendingInvoiceResult => ({
    isProcessed: false,
    isPaid: true,
  }),
  paidWithError: (error: ApplicationError): ProcessPendingInvoiceResult => ({
    isProcessed: false,
    isPaid: true,
    error,
  }),
  processedOnly: (reason: ProcessedReason): ProcessPendingInvoiceResult => ({
    isProcessed: true,
    isPaid: false,
    reason,
  }),
  notPaid: (): ProcessPendingInvoiceResult => ({
    isProcessed: false,
    isPaid: false,
  }),
  err: (error: ApplicationError): ProcessPendingInvoiceResult => ({
    isProcessed: false,
    isPaid: false,
    error,
  }),
}
