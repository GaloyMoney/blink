import { DomainError, ValidationError, ErrorLevel } from "@domain/shared"

export class AuthenticationError extends DomainError {}
export class LikelyNoUserWithThisPhoneExistError extends AuthenticationError {}
export class LikelyUserAlreadyExistError extends AuthenticationError {}

export class AccountHasPositiveBalanceError extends AuthenticationError {}
export class PhoneAlreadyExistsError extends AuthenticationError {}

export class EmailCodeInvalidError extends AuthenticationError {}
export class EmailUnverifiedError extends AuthenticationError {}
export class AccountAlreadyHasEmailError extends AuthenticationError {}

export class IdentifierNotFoundError extends AuthenticationError {}

export class EmailValidationSubmittedTooOftenError extends AuthenticationError {}

export class AuthZHeaderForAuthNValidationError extends ValidationError {}
export class MissingAuthZHeaderForAuthNError extends AuthZHeaderForAuthNValidationError {}
export class InvalidAuthZHeaderForAuthNError extends AuthZHeaderForAuthNValidationError {}

export class RegistrationPayloadValidationError extends ValidationError {}
export class MissingRegistrationPayloadPropertiesError extends RegistrationPayloadValidationError {}
export class UnsupportedSchemaTypeError extends RegistrationPayloadValidationError {}

export class AuthTokenUserIdMismatchError extends AuthenticationError {
  level = ErrorLevel.Critical
}
