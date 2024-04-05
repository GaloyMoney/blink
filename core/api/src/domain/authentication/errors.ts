import { DomainError, ErrorLevel } from "@/domain/shared"

export class AuthenticationError extends DomainError {}
export class LikelyNoUserWithThisPhoneExistError extends AuthenticationError {}
export class LikelyUserAlreadyExistError extends AuthenticationError {}
export class LikelyBadCoreError extends AuthenticationError {}

export class AccountHasPositiveBalanceError extends AuthenticationError {}
export class PhoneAlreadyExistsError extends AuthenticationError {}

export class EmailCodeInvalidError extends AuthenticationError {}
export class EmailCodeExpiredError extends AuthenticationError {}
export class EmailUnverifiedError extends AuthenticationError {}
export class AccountAlreadyHasEmailError extends AuthenticationError {}

export class IdentifierNotFoundError extends AuthenticationError {}

export class EmailValidationSubmittedTooOftenError extends AuthenticationError {}

export class AuthTokenUserIdMismatchError extends AuthenticationError {
  level = ErrorLevel.Critical
}
