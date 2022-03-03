import { DomainError, ErrorLevel } from "@domain/shared"

export class TwoFAError extends DomainError {}

export class TwoFAValidationError extends TwoFAError {}
export class TwoFAAlreadySetError extends TwoFAError {}
export class TwoFANewCodeNeededError extends TwoFAError {}
export class UnknownTwoFAError extends TwoFAError {
  level = ErrorLevel.Critical
}
export class TwoFANeedToBeSetBeforeDeletionError extends TwoFAError {}
