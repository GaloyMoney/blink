import { DomainError, ErrorLevel } from "@domain/errors"

export class LockError extends DomainError {}

export class LockServiceError extends LockError {}
export class ResourceAttemptsLockServiceError extends LockServiceError {
  level = ErrorLevel.Warn
}
export class UnknownLockServiceError extends LockServiceError {
  level = ErrorLevel.Critical
}
