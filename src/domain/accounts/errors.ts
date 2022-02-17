import { DomainError } from "@domain/errors"

export class AccountError extends DomainError {}

export class ApiKeyError extends AccountError {}
export class ApiKeyHashError extends ApiKeyError {}
export class InvalidApiKeyError extends ApiKeyError {}
export class InvalidExpirationError extends ApiKeyError {}

export class UsernameNotAvailableError extends AccountError {}
export class UsernameIsImmutableError extends AccountError {}
