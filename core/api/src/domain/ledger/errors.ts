import { DomainError, ErrorLevel } from "@/domain/shared"

export class LedgerError extends DomainError {}

export class LedgerServiceError extends LedgerError {}
export class FeeDifferenceError extends LedgerError {}
export class NoTransactionToSettleError extends LedgerServiceError {}
export class InvalidPaginationArgumentsError extends LedgerServiceError {}
export class MismatchedResultForTransactionMetadataQuery extends LedgerServiceError {}
export class MultiplePendingPaymentsForHashError extends LedgerServiceError {
  level = ErrorLevel.Critical
}
export class MissingExpectedDisplayAmountsForTransactionError extends LedgerServiceError {
  level = ErrorLevel.Critical
}
export class InvalidLnPaymentTxnsBundleError extends LedgerServiceError {
  level = ErrorLevel.Critical
}
export class UnknownLedgerError extends LedgerServiceError {
  level = ErrorLevel.Critical
}

export class CouldNotFindTransactionError extends LedgerError {}
export class CouldNotFindTransactionMetadataError extends CouldNotFindTransactionError {}
export class CouldNotFindExpectedTransactionMetadataError extends CouldNotFindTransactionError {
  level = ErrorLevel.Critical
}
