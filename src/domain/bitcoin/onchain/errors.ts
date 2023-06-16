import { DomainError, ErrorLevel } from "@domain/shared"

export class OnChainError extends DomainError {}

export class TransactionDecodeError extends OnChainError {}

export class OnChainServiceError extends OnChainError {}
export class OnChainAddressAlreadyCreatedForRequestIdError extends OnChainServiceError {}
export class OnChainAddressNotFoundError extends OnChainServiceError {}
export class PayoutNotFoundError extends OnChainServiceError {}
export class PayoutDestinationBlocked extends OnChainServiceError {
  level = ErrorLevel.Critical
}
export class CPFPAncestorLimitReachedError extends OnChainServiceError {
  level = ErrorLevel.Critical
}
export class InsufficientOnChainFundsError extends OnChainServiceError {
  level = ErrorLevel.Critical
}
export class UnexpectedDustAmountError extends OnChainServiceError {
  level = ErrorLevel.Critical
}
export class UnknownOnChainServiceError extends OnChainServiceError {
  level = ErrorLevel.Critical
}
export class CouldNotFindOnChainTransactionError extends OnChainServiceError {}
export class OnChainServiceUnavailableError extends OnChainServiceError {
  level = ErrorLevel.Critical
}
export class OnChainServiceBusyError extends OnChainServiceError {
  level = ErrorLevel.Critical
}
