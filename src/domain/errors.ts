class DomainError extends Error {
  name = this.constructor.name
}

export class AuthorizationError extends DomainError {}

export class RepositoryError extends DomainError {}

export class UnknownRepositoryError extends DomainError {}
export class CouldNotFindError extends DomainError {}

export class ValidationError extends DomainError {}
export class InvalidSatoshiAmount extends ValidationError {}
export class InvalidUsername extends ValidationError {}
