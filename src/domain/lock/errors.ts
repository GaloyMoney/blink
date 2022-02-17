import { DomainError, ErrorLevel } from "@domain/errors"

export class LockError extends DomainError {}

export class LockServiceError extends LockError {}
export class UnknownLockServiceError extends LockServiceError {
  level = ErrorLevel.Critical
}
