import { DomainError, ErrorLevel } from "@domain/errors"

export class OnChainError extends DomainError {}

export class TransactionDecodeError extends OnChainError {}

export class OnChainServiceError extends OnChainError {}
export class UnknownOnChainServiceError extends OnChainServiceError {
  level = ErrorLevel.Critical
}
export class CouldNotFindOnChainTransactionError extends OnChainServiceError {}
export class OnChainServiceUnavailableError extends OnChainServiceError {
  level = ErrorLevel.Critical
}
