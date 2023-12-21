import { ValidationError, DomainError, ErrorLevel } from "./shared"

export class InconsistentDataError extends DomainError {}

export class OperationInterruptedError extends DomainError {}

export class AuthorizationError extends DomainError {}

export class RepositoryError extends DomainError {}
export class UnknownRepositoryError extends RepositoryError {
  level = ErrorLevel.Critical
}
export class PersistError extends RepositoryError {}
export class DuplicateError extends RepositoryError {}

export class BadInputsForFindError extends RepositoryError {}
export class CouldNotFindError extends RepositoryError {}
export class CouldNotUpdateError extends RepositoryError {}
export class DuplicateKeyForPersistError extends RepositoryError {}
export class InvalidDocumentIdForDbError extends RepositoryError {
  level = ErrorLevel.Critical
}
export class CannotConnectToDbError extends RepositoryError {
  level = ErrorLevel.Critical
}
export class DbConnectionClosedError extends RepositoryError {
  level = ErrorLevel.Critical
}
export class MultipleWalletsFoundForAccountIdAndCurrency extends RepositoryError {}
export class WalletInvoiceMissingLnInvoiceError extends RepositoryError {}

export class CouldNotUnsetPhoneFromUserError extends CouldNotUpdateError {}

export class CouldNotFindWalletInvoiceError extends CouldNotFindError {}

export class CouldNotFindAccountError extends CouldNotFindError {}
export class CouldNotFindUserError extends CouldNotFindError {}
export class CouldNotFindUserFromIdError extends CouldNotFindError {}
export class CouldNotFindAccountIpError extends CouldNotFindError {}
export class CouldNotFindUserFromPhoneError extends CouldNotFindError {}
export class CouldNotFindUserFromEmailError extends CouldNotFindError {}
export class CouldNotFindUserFromWalletIdError extends CouldNotFindError {}
export class CouldNotFindWalletFromIdError extends CouldNotFindError {}
export class CouldNotListWalletsFromAccountIdError extends CouldNotFindError {}
export class CouldNotFindWalletFromUsernameError extends CouldNotFindError {}
export class CouldNotFindWalletFromUsernameAndCurrencyError extends CouldNotFindError {}
export class CouldNotFindWalletFromAccountIdAndCurrencyError extends CouldNotFindError {}
export class CouldNotFindWalletFromOnChainAddressError extends CouldNotFindError {}
export class CouldNotFindWalletFromOnChainAddressesError extends CouldNotFindError {}
export class CouldNotListWalletsFromWalletCurrencyError extends CouldNotFindError {}
export class CouldNotFindWalletOnChainPendingReceiveError extends CouldNotFindError {}
export class NoTransactionToUpdateError extends CouldNotFindError {}
export class CouldNotFindLightningPaymentFlowError extends CouldNotFindError {}
export class CouldNotUpdateLightningPaymentFlowError extends CouldNotFindError {
  level = ErrorLevel.Critical
}
export class NoExpiredLightningPaymentFlowsError extends CouldNotFindError {}
export class CouldNotFindBtcWalletForAccountError extends CouldNotFindError {
  level = ErrorLevel.Critical
}
export class CouldNotFindLnPaymentFromHashError extends CouldNotFindError {}

export class CouldNotFindAccountFromIdError extends CouldNotFindError {}
export class CouldNotFindAccountFromUsernameError extends CouldNotFindError {}
export class CouldNotFindAccountFromPhoneError extends CouldNotFindError {}
export class CouldNotFindTransactionsForAccountError extends CouldNotFindError {}
export class CouldNotFindAccountFromKratosIdError extends CouldNotFindError {}

export class QuizAlreadyPresentError extends DomainError {}

export class NotImplementedError extends DomainError {}
export class NotReachableError extends DomainError {}
export class InvalidNegativeAmountError extends DomainError {}
export class MissingPhoneError extends DomainError {}

export class ContactNotExistentError extends DomainError {}

export class InvalidWithdrawFeeError extends ValidationError {}
export class InvalidCurrencyBaseAmountError extends ValidationError {}
export class InvalidSatoshiAmountError extends ValidationError {}
export class InvalidUsdCents extends ValidationError {}
export class NonIntegerError extends ValidationError {}
export class InvalidOnChainAddress extends ValidationError {}
export class InvalidPubKeyError extends ValidationError {}
export class InvalidScanDepthAmount extends ValidationError {}
export class SatoshiAmountRequiredError extends ValidationError {}
export class InvalidUsername extends ValidationError {}
export class InvalidDeviceId extends ValidationError {}
export class InvalidIdentityPassword extends ValidationError {}
export class InvalidIdentityUsername extends ValidationError {}
export class InvalidContactAlias extends ValidationError {}
export class InvalidCoordinatesError extends ValidationError {}
export class InvalidBusinessTitleLengthError extends ValidationError {}
export class InvalidPhoneNumber extends ValidationError {}
export class InvalidUserId extends ValidationError {}
export class InvalidEmailAddress extends ValidationError {}
export class InvalidWalletId extends ValidationError {}
export class InvalidFlowId extends ValidationError {}
export class InvalidTotpCode extends ValidationError {}
export class InvalidLedgerTransactionId extends ValidationError {}
export class InvalidLedgerTransactionStateError extends ValidationError {}
export class InvalidDisplayCurrencyError extends ValidationError {}
export class AlreadyPaidError extends ValidationError {}
export class SelfPaymentError extends ValidationError {}
export class LessThanDustThresholdError extends ValidationError {}
export class AmountLessThanFeeError extends ValidationError {}
export class InsufficientBalanceError extends ValidationError {}
export class InvalidCurrencyForWalletError extends ValidationError {}
export class BalanceLessThanZeroError extends ValidationError {}
export class NoContactForUsernameError extends ValidationError {}
export class NoWalletExistsForUserError extends ValidationError {}
export class NoBtcWalletExistsForAccountError extends ValidationError {}
export class InvalidQuizQuestionIdError extends ValidationError {}
export class MissingIPMetadataError extends ValidationError {}

export class InvalidIpMetadataError extends ValidationError {
  level = ErrorLevel.Critical
}
export class NotEnoughBalanceForQuizError extends ValidationError {
  level = ErrorLevel.Warn
}

export class UnauthorizedIPForOnboardingError extends AuthorizationError {}

export class UnauthorizedIPError extends AuthorizationError {}
export class UnauthorizedIPMetadataProxyError extends UnauthorizedIPError {}
export class UnauthorizedIPMetadataCountryError extends UnauthorizedIPError {}
export class UnauthorizedIPMetadataASNError extends UnauthorizedIPError {}

export class InvalidDeviceTokenError extends ValidationError {}

export class InvalidLanguageError extends ValidationError {}
export class InvalidAccountLevelError extends ValidationError {}
export class InvalidAccountLimitTypeError extends ValidationError {}

export class LimitsExceededError extends ValidationError {}
export class WithdrawalLimitsExceededError extends LimitsExceededError {}
export class IntraledgerLimitsExceededError extends LimitsExceededError {}
export class TradeIntraAccountLimitsExceededError extends LimitsExceededError {}

export class LnRouteValidationError extends ValidationError {}
export class BadAmountForRouteError extends LnRouteValidationError {}

export class MismatchedCurrencyForWalletError extends ValidationError {}

export class InvalidAccountStatusError extends ValidationError {}
export class InactiveAccountError extends InvalidAccountStatusError {}

export class InvalidMinutesError extends ValidationError {}

export class InvalidPaginatedQueryArgsError extends ValidationError {}

export class InvalidNonHodlInvoiceError extends ValidationError {
  level = ErrorLevel.Critical
}
export class MultipleCurrenciesForSingleCurrencyOperationError extends ValidationError {
  level = ErrorLevel.Critical
}

export class InvalidIdempotencyKeyError extends ValidationError {}
