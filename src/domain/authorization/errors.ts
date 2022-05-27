export class AuthorizationServiceError extends Error {
  name = this.constructor.name
}

export class UnknownAuthorizationServiceError extends AuthorizationServiceError {}
