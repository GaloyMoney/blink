export const PaymentSendAttemptResultType = {
  Ok: "success",
  Pending: "pending",
  AlreadyPaid: "alreadyPaid",
  Error: "error",
} as const

export const IntraLedgerSendAttemptResult = {
  ok: (journalId: LedgerJournalId): IntraLedgerSendAttemptResult => ({
    type: PaymentSendAttemptResultType.Ok,
    journalId,
  }),
  alreadyPaid: (): IntraLedgerSendAttemptResult => ({
    type: PaymentSendAttemptResultType.AlreadyPaid,
  }),
  err: (error: ApplicationError): IntraLedgerSendAttemptResult => ({
    type: PaymentSendAttemptResultType.Error,
    error,
  }),
}

export const LnSendAttemptResult = {
  ok: (journalId: LedgerJournalId): PaymentSendAttemptResult => ({
    type: PaymentSendAttemptResultType.Ok,
    journalId,
  }),
  alreadyPaid: (): PaymentSendAttemptResult => ({
    type: PaymentSendAttemptResultType.AlreadyPaid,
  }),
  err: (error: ApplicationError): PaymentSendAttemptResult => ({
    type: PaymentSendAttemptResultType.Error,
    error,
  }),
  pending: (): PaymentSendAttemptResult => ({
    type: PaymentSendAttemptResultType.Pending,
  }),
}
