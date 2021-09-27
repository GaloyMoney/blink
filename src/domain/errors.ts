export class InconsistentDataError extends Error {}

class DomainError extends Error {
  name = this.constructor.name
}

export class AuthorizationError extends DomainError {}

export class RepositoryError extends DomainError {}
export class UnknownRepositoryError extends RepositoryError {}
export class CouldNotFindError extends RepositoryError {}
export class PersistError extends RepositoryError {}

export class ValidationError extends DomainError {}
export class InvalidSatoshiAmount extends ValidationError {}
export class InvalidWalletName extends ValidationError {}
export class AlreadyPaidError extends ValidationError {}
export class SelfPaymentError extends ValidationError {}
