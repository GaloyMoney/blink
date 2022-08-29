import { DomainError, ErrorLevel } from "@domain/shared"

export class LedgerError extends DomainError {}

export class LedgerServiceError extends LedgerError {}
export class FeeDifferenceError extends LedgerError {}
export class NoTransactionToSettleError extends LedgerServiceError {}
export class UnknownLedgerError extends LedgerServiceError {
  level = ErrorLevel.Critical
}

export class CouldNotFindTransactionError extends LedgerError {}
export class CouldNotFindTransactionMetadataError extends CouldNotFindTransactionError {}
