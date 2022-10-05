import { ValidationError, DomainError, ErrorLevel } from "./shared"

export class InconsistentDataError extends DomainError {}

export class AuthorizationError extends DomainError {}

export class RepositoryError extends DomainError {}
export class UnknownRepositoryError extends RepositoryError {
  level = ErrorLevel.Critical
}
export class PersistError extends RepositoryError {}
export class DuplicateError extends RepositoryError {}

export class BadInputsForFindError extends RepositoryError {}
export class CouldNotFindError extends RepositoryError {}
export class CannotConnectToDbError extends RepositoryError {
  level = ErrorLevel.Critical
}
export class DbConnectionClosedError extends RepositoryError {
  level = ErrorLevel.Critical
}

export class CouldNotFindWalletInvoiceError extends CouldNotFindError {}

export class CouldNotFindUserError extends CouldNotFindError {}
export class CouldNotFindUserFromIdError extends CouldNotFindError {}
export class CouldNotFindUserFromPhoneError extends CouldNotFindError {}
export class CouldNotFindUserFromWalletIdError extends CouldNotFindError {}
export class CouldNotFindPhoneCodeError extends CouldNotFindError {}
export class CouldNotFindWalletFromIdError extends CouldNotFindError {}
export class CouldNotListWalletsFromAccountIdError extends CouldNotFindError {}
export class CouldNotFindWalletFromUsernameError extends CouldNotFindError {}
export class CouldNotFindWalletFromUsernameAndCurrencyError extends CouldNotFindError {}
export class CouldNotFindWalletFromOnChainAddressError extends CouldNotFindError {}
export class CouldNotFindWalletFromOnChainAddressesError extends CouldNotFindError {}
export class CouldNotListWalletsFromWalletCurrencyError extends CouldNotFindError {}
export class NoTransactionToUpdateError extends CouldNotFindError {}
export class CouldNotFindLightningPaymentFlowError extends CouldNotFindError {}
export class CouldNotUpdateLightningPaymentFlowError extends CouldNotFindError {}
export class NoExpiredLightningPaymentFlowsError extends CouldNotFindError {}
export class CouldNotFindBtcWalletForAccountError extends CouldNotFindError {
  level = ErrorLevel.Critical
}
export class CouldNotFindLnPaymentFromHashError extends CouldNotFindError {
  level = ErrorLevel.Critical
}

export class CouldNotFindAccountFromUsernameError extends CouldNotFindError {}
export class CouldNotFindAccountFromPhoneError extends CouldNotFindError {}
export class CouldNotFindTransactionsForAccountError extends CouldNotFindError {}
export class CouldNotFindAccountFromKratosIdError extends CouldNotFindError {}

export class RewardAlreadyPresentError extends DomainError {}

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
export class InvalidContactAlias extends ValidationError {}
export class InvalidCoordinatesError extends ValidationError {}
export class InvalidBusinessTitleLengthError extends ValidationError {}
export class InvalidPhoneNumber extends ValidationError {}
export class InvalidKratosUserId extends ValidationError {}
export class InvalidEmailAddress extends ValidationError {}
export class InvalidWalletId extends ValidationError {}
export class InvalidLedgerTransactionId extends ValidationError {}
export class InvalidLedgerTransactionStateError extends ValidationError {}
export class AlreadyPaidError extends ValidationError {}
export class SelfPaymentError extends ValidationError {}
export class LessThanDustThresholdError extends ValidationError {}
export class InsufficientBalanceError extends ValidationError {}
export class InvalidCurrencyForWalletError extends ValidationError {}
export class BalanceLessThanZeroError extends ValidationError {}
export class InvalidTargetConfirmations extends ValidationError {}
export class NoContactForUsernameError extends ValidationError {}
export class NoWalletExistsForUserError extends ValidationError {}
export class NoBtcWalletExistsForAccountError extends ValidationError {}
export class RebalanceNeededError extends ValidationError {}
export class InvalidQuizQuestionIdError extends ValidationError {}
export class MissingPhoneMetadataError extends ValidationError {}
export class InvalidPhoneMetadataTypeError extends ValidationError {}
export class InvalidPhoneMetadataCountryError extends ValidationError {}
export class InvalidPhoneMetadataForRewardError extends ValidationError {}

export class MissingIPMetadataError extends ValidationError {}
export class InvalidIPMetadataProxyError extends ValidationError {}
export class InvalidIPMetadataCountryError extends ValidationError {}
export class InvalidIPMetadataASNError extends ValidationError {}
export class InvalidIPMetadataForRewardError extends ValidationError {}

export class InvalidLanguageError extends ValidationError {}
export class InvalidAccountLevelError extends ValidationError {}

export class LimitsExceededError extends ValidationError {}
export class WithdrawalLimitsExceededError extends LimitsExceededError {}
export class IntraledgerLimitsExceededError extends LimitsExceededError {}
export class TradeIntraAccountLimitsExceededError extends LimitsExceededError {}
export class TwoFALimitsExceededError extends LimitsExceededError {}

export class LnRouteValidationError extends ValidationError {}
export class BadAmountForRouteError extends LnRouteValidationError {}

export class InvalidAccountStatusError extends ValidationError {}
export class InactiveAccountError extends InvalidAccountStatusError {}
export class InvalidNonHodlInvoiceError extends ValidationError {
  level = ErrorLevel.Critical
}
