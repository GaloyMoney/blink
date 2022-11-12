import { DomainError, ErrorLevel } from "@domain/shared"

export class OnChainError extends DomainError {}

export class TransactionDecodeError extends OnChainError {}

export class OnChainServiceError extends OnChainError {}
export class CPFPAncestorLimitReachedError extends OnChainServiceError {
  level = ErrorLevel.Critical
}
export class InsufficientOnChainFundsError extends OnChainServiceError {
  level = ErrorLevel.Critical
}
export class UnknownOnChainServiceError extends OnChainServiceError {
  level = ErrorLevel.Critical
}
export class CouldNotFindOnChainTransactionError extends OnChainServiceError {}
export class OnChainServiceUnavailableError extends OnChainServiceError {
  level = ErrorLevel.Critical
}
