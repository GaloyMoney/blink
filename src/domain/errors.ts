export class InconsistentDataError extends Error {}

class DomainError extends Error {
  name = this.constructor.name
}

export class AuthorizationError extends DomainError {}

export class RepositoryError extends DomainError {}
export class UnknownRepositoryError extends RepositoryError {}
export class PersistError extends RepositoryError {}
export class DuplicateError extends RepositoryError {}

export class CouldNotFindError extends RepositoryError {}

export class CouldNotFindWalletInvoiceError extends CouldNotFindError {}

export class CouldNotFindUserError extends CouldNotFindError {}
export class CouldNotFindUserFromIdError extends CouldNotFindError {}
export class CouldNotFindUserFromUsernameError extends CouldNotFindError {}
export class CouldNotFindUserFromPhoneError extends CouldNotFindError {}
export class CouldNotFindUserFromWalletIdError extends CouldNotFindError {}
export class CouldNotFindPhoneCodeError extends CouldNotFindError {}
export class CouldNotFindWalletFromIdError extends CouldNotFindError {}
export class CouldNotFindWalletFromUsernameError extends CouldNotFindError {}
export class CouldNotFindWalletFromOnChainAddressError extends CouldNotFindError {}
export class CouldNotFindWalletFromPublicIdError extends CouldNotFindError {}
export class CouldNotFindWalletFromOnChainAddressesError extends CouldNotFindError {}

export class CouldNotFindAccountFromUsernameError extends CouldNotFindError {}
export class CouldNotFindAccountFromPhoneError extends CouldNotFindError {}

export class ValidationError extends DomainError {}
export class InvalidSatoshiAmount extends ValidationError {}
export class SatoshiAmountRequiredError extends ValidationError {}
export class InvalidUsername extends ValidationError {}
export class InvalidPhoneNumber extends ValidationError {}
export class InvalidPublicWalletId extends ValidationError {}
export class InvalidLedgerTransactionId extends ValidationError {}
export class AlreadyPaidError extends ValidationError {}
export class SelfPaymentError extends ValidationError {}
export class LessThanDustThresholdError extends ValidationError {}
export class InsufficientBalanceError extends ValidationError {}
export class InvalidTargetConfirmations extends ValidationError {}
export class NoContactForUsernameError extends ValidationError {}
export class LnPaymentRequestNonZeroAmountRequiredError extends ValidationError {}
export class LnPaymentRequestZeroAmountRequiredError extends ValidationError {}
export class NoWalletExistsForUserError extends ValidationError {}

export class LimitsExceededError extends ValidationError {}
export class WithdrawalLimitsExceededError extends LimitsExceededError {}
export class IntraledgerLimitsExceededError extends LimitsExceededError {}
export class TwoFALimitsExceededError extends LimitsExceededError {}
