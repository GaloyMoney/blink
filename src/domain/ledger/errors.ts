export class LedgerError extends Error {
  name = this.constructor.name
}

export class UnknownLedgerError extends LedgerError {}
