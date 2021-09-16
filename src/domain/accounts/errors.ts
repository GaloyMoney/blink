export class AccountError extends Error {
  name = this.constructor.name
}

export class ApiKeyError extends AccountError {}
export class ApiKeyHashError extends ApiKeyError {}
export class InvalidApiKeyError extends ApiKeyError {}
export class InvalidExpirationError extends ApiKeyError {}
