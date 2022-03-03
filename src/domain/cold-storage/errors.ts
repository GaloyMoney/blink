import { DomainError, ErrorLevel } from "@domain/shared"

export class ColdStorageError extends DomainError {}

export class ColdStorageServiceError extends ColdStorageError {}
export class InvalidCurrentColdStorageWalletServiceError extends ColdStorageServiceError {}
export class InsufficientBalanceForRebalanceError extends ColdStorageServiceError {}
export class InvalidOrNonWalletTransactionError extends ColdStorageServiceError {}
export class UnknownColdStorageServiceError extends ColdStorageServiceError {
  level = ErrorLevel.Critical
}
