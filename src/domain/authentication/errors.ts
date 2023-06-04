import { DomainError } from "@domain/shared"

export class AuthenticationError extends DomainError {}
export class LikelyNoUserWithThisPhoneExistError extends AuthenticationError {}
export class LikelyUserAlreadyExistError extends AuthenticationError {}
export class PhoneIdentityDoesNotExistError extends AuthenticationError {}
export class UserWithPhoneAlreadyExistsError extends AuthenticationError {}
export class JwtVerifyTokenError extends AuthenticationError {}
export class JwtSubjectUndefinedError extends AuthenticationError {}
