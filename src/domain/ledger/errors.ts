export class LedgerError extends Error {
  name = this.constructor.name
}

export class LedgerServiceError extends LedgerError {}
export class FeeDifferenceError extends LedgerError {}
export class NoTransactionToSettleError extends LedgerServiceError {}
export class UnknownLedgerError extends LedgerServiceError {}

export class CouldNotFindTransactionError extends LedgerError {}
export class CouldNotFindTransactionMetadataError extends CouldNotFindTransactionError {}
