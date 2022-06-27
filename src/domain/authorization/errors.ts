import { DomainError, ErrorLevel } from "@domain/shared"

export class AuthorizationServiceError extends DomainError {}

export class UnknownAuthorizationServiceError extends AuthorizationServiceError {}

export class AuthorizationError extends DomainError {}
