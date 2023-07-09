import { DomainError } from "@domain/shared"

export class AuthenticationError extends DomainError {}
export class LikelyNoUserWithThisPhoneExistError extends AuthenticationError {}
export class LikelyUserAlreadyExistError extends AuthenticationError {}
export class PhoneIdentityDoesNotExistError extends AuthenticationError {}

export class AccountHasPositiveBalanceError extends AuthenticationError {}
export class PhoneAlreadyExistsError extends AuthenticationError {}

export class EmailCodeInvalidError extends AuthenticationError {}
export class EmailNotVerifiedError extends AuthenticationError {}
export class EmailAlreadyExistsError extends AuthenticationError {}

export class EmailValidationSubmittedTooOftenError extends AuthenticationError {}
