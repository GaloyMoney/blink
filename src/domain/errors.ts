export class AuthorizationError extends Error {
  name = this.constructor.name
}

export class RepositoryError extends Error {
  name = this.constructor.name
}
export class UnknownRepositoryError extends RepositoryError {}
export class CouldNotFindError extends RepositoryError {}
