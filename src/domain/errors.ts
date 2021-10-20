export class InconsistentDataError extends Error {}

class DomainError extends Error {
  name = this.constructor.name
}

export class AuthorizationError extends DomainError {}

export class RepositoryError extends DomainError {}
export class UnknownRepositoryError extends RepositoryError {}
export class CouldNotFindError extends RepositoryError {}
export class PersistError extends RepositoryError {}
export class DuplicateError extends RepositoryError {}

export class ValidationError extends DomainError {}
export class InvalidSatoshiAmount extends ValidationError {}
export class InvalidUsername extends ValidationError {}
export class InvalidPublicWalletId extends ValidationError {}
export class InvalidLedgerTransactionId extends ValidationError {}
export class AlreadyPaidError extends ValidationError {}
export class SelfPaymentError extends ValidationError {}
export class LessThanDustThresholdError extends ValidationError {}
export class InsufficientBalanceError extends ValidationError {}
export class InvalidTargetConfirmations extends ValidationError {}
export class LimitsExceededError extends ValidationError {}
export class NoUserForUsernameError extends ValidationError {}
export class NoContactForUsernameError extends ValidationError {}

export class TwoFALimitsExceededError extends LimitsExceededError {}
