class CoreError extends Error {
  name = this.constructor.name
}

export class AuthorizationError extends CoreError {}

export class RepositoryError extends CoreError {}
export class UnknownRepositoryError extends RepositoryError {}
export class CouldNotFindError extends RepositoryError {}
