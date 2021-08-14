export class LedgerError extends Error {
  name = this.constructor.name
}

export class LedgerServiceError extends LedgerError {}
export class UnknownLedgerError extends LedgerServiceError {}
