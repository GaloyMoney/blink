import { DomainError } from "@domain/shared"

export class AuthenticationError extends DomainError {}
export class LikelyNoUserWithThisPhoneExistError extends AuthenticationError {}
export class LikelyNoUserWithThisEmailExistError extends AuthenticationError {}
export class LikelyUserAlreadyExistError extends AuthenticationError {}
export class PhoneIdentityDoesNotExistError extends AuthenticationError {}
export class EmailIdentityDoesNotExistError extends AuthenticationError {}
export class UserWithPhoneAlreadyExistsError extends AuthenticationError {}
export class UserWithEmailAlreadyExistsError extends AuthenticationError {}
