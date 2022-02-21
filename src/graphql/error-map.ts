import {
  TransactionRestrictedError,
  LightningPaymentError,
  TwoFAError,
  NotFoundError,
  SelfPaymentError,
  InsufficientBalanceError,
  DbError,
  UnknownClientError,
  InvoiceDecodeError,
  ValidationInternalError,
  TooManyRequestError,
  RouteFindingError,
  InvalidCoordinatesError,
  InvalidBusinessTitleLengthError,
  PhoneCodeError,
  UsernameError,
  RebalanceNeededError,
} from "@graphql/error"
import { baseLogger } from "@services/logger"

const assertUnreachable = (x: never): never => {
  throw new Error(`This should never compile with ${x}`)
}

export const mapError = (error: ApplicationError): CustomApolloError => {
  const errorName = error.name as ApplicationErrorKey
  let message = error.message || errorName || ""
  switch (errorName) {
    case "WithdrawalLimitsExceededError":
      message = error.message
      return new TransactionRestrictedError({ message, logger: baseLogger })

    case "IntraledgerLimitsExceededError":
      message = error.message
      return new TransactionRestrictedError({ message, logger: baseLogger })

    case "TwoFANewCodeNeededError":
      message = "Need a 2FA code to proceed with the payment"
      return new TwoFAError({ message, logger: baseLogger })

    case "TwoFALimitsExceededError":
      message = "Need a 2FA code to proceed with the payment"
      return new TwoFAError({ message, logger: baseLogger })

    case "TwoFAValidationError":
      message = "Invalid 2FA token passed"
      return new TwoFAError({ message, logger: baseLogger })

    case "AlreadyPaidError":
      message = "Invoice is already paid"
      return new LightningPaymentError({ message, logger: baseLogger })

    case "CouldNotFindWalletInvoiceError":
      message = `User tried to pay invoice with hash ${error.message}, but it does not exist`
      return new LightningPaymentError({ message, logger: baseLogger })

    case "NoValidNodeForPubkeyError":
      message = `Temporary failure when trying to pay, please retry payment`
      return new LightningPaymentError({ message, logger: baseLogger })

    case "InvoiceExpiredOrBadPaymentHashError":
      message = `Invoice already expired, or has bad payment hash`
      return new LightningPaymentError({ message, logger: baseLogger })

    case "CouldNotFindUserFromIdError":
      message = `User does not exist for id ${error.message}`
      return new NotFoundError({ message, logger: baseLogger })

    case "CouldNotFindAccountFromUsernameError":
      message = `Account does not exist for username ${error.message}`
      return new NotFoundError({ message, logger: baseLogger })

    case "CouldNotFindUserFromPhoneError":
      message = `User does not exist for phone ${error.message}`
      return new NotFoundError({ message, logger: baseLogger })

    case "CouldNotFindUserFromWalletIdError":
      message = `User does not exist for wallet-id ${error.message}`
      return new NotFoundError({ message, logger: baseLogger })

    case "ContactNotExistentError":
      message = `Contact does not exist for account ${error.message}`
      return new NotFoundError({ message, logger: baseLogger })

    case "SelfPaymentError":
      message = "User tried to pay themselves"
      return new SelfPaymentError({ message, logger: baseLogger })

    case "InsufficientBalanceError":
      return new InsufficientBalanceError({ message, logger: baseLogger })

    case "LnInvoiceMissingPaymentSecretError":
      message = "Invoice is missing its 'payment secret' value"
      return new InvoiceDecodeError({ message, logger: baseLogger })

    case "SatoshiAmountRequiredError":
      message = "An amount is required to complete payment"
      return new ValidationInternalError({ message, logger: baseLogger })

    case "InvalidSatoshiAmountError":
      message = "A valid satoshi amount is required"
      return new ValidationInternalError({ message, logger: baseLogger })

    case "LnPaymentRequestNonZeroAmountRequiredError":
      message = "Invoice does not have a valid amount to pay"
      return new ValidationInternalError({ message, logger: baseLogger })

    case "LnPaymentRequestZeroAmountRequiredError":
      message = "Invoice must be a zero-amount invoice"
      return new ValidationInternalError({ message, logger: baseLogger })

    case "InvalidPhoneNumberPhoneProviderError":
      message = "Phone number is not a valid phone number"
      return new ValidationInternalError({ message, logger: baseLogger })

    case "InvalidContactAlias":
      message = "ContactAlias has incorrect characters or length"
      return new ValidationInternalError({ message, logger: baseLogger })

    case "InvoiceCreateRateLimiterExceededError":
    case "InvoiceCreateForRecipientRateLimiterExceededError":
      message = "Too many invoices creation, please wait for a while and try again."
      return new TooManyRequestError({ message, logger: baseLogger })

    case "OnChainAddressCreateRateLimiterExceededError":
      message =
        "Too many onchain addresses creation, please wait for a while and try again."
      return new TooManyRequestError({ message, logger: baseLogger })

    case "UserPhoneCodeAttemptPhoneRateLimiterExceededError":
      message = "Too many phone code attempts, please wait for a while and try again."
      return new TooManyRequestError({ message, logger: baseLogger })

    case "UserPhoneCodeAttemptIpRateLimiterExceededError":
      message =
        "Too many phone code attempts on same network, please wait for a while and try again."
      return new TooManyRequestError({ message, logger: baseLogger })

    case "CouldNotFindPhoneCodeError":
      message = "Invalid or incorrect phone code entered."
      return new PhoneCodeError({ message, logger: baseLogger })

    case "CouldNotFindAccountFromPhoneError":
      message = "Invalid or incorrect phone entered."
      return new PhoneCodeError({ message, logger: baseLogger })

    case "UserLoginPhoneRateLimiterExceededError":
      message = "Too many login attempts, please wait for a while and try again."
      return new TooManyRequestError({ message, logger: baseLogger })

    case "UserLoginIpRateLimiterExceededError":
      message =
        "Too many login attempts on same network, please wait for a while and try again."
      return new TooManyRequestError({ message, logger: baseLogger })

    case "InvalidQuizQuestionIdError":
      message = "Invalid quiz question id was passed."
      return new ValidationInternalError({ message, logger: baseLogger })

    case "RewardAlreadyPresentError":
      message = "Reward for quiz question was already claimed."
      return new ValidationInternalError({ message, logger: baseLogger })

    case "InvalidPhoneMetadataForRewardError":
      message = "Unsupported phone carrier for rewards."
      return new ValidationInternalError({ message, logger: baseLogger })

    case "RouteNotFoundError":
      message = "Unable to find a route for payment."
      return new RouteFindingError({ message, logger: baseLogger })

    case "UnknownRouteNotFoundError":
      message = "Unknown error occurred when trying to find a route for payment."
      return new RouteFindingError({ message, logger: baseLogger })

    case "UnknownLnInvoiceDecodeError":
      // TODO: Consider using `error.message` somehow since lib returns semi-sensible details
      message = "Invalid lightning request, couldn't decode."
      return new InvoiceDecodeError({ message, logger: baseLogger })

    case "UnknownRepositoryError":
      return new DbError({ message, logger: baseLogger, level: "fatal" })

    case "UnknownLedgerError":
      return new DbError({ message, logger: baseLogger, level: "fatal" })

    case "UnknownLightningServiceError":
      return new LightningPaymentError({ message, logger: baseLogger })

    case "UnknownTwoFAError":
      return new TwoFAError({ message, logger: baseLogger })

    case "InvalidCoordinatesError":
      return new InvalidCoordinatesError({ logger: baseLogger })

    case "InvalidBusinessTitleLengthError":
      return new InvalidBusinessTitleLengthError({ logger: baseLogger })

    case "UsernameNotAvailableError":
      message = "username not available"
      return new UsernameError({ logger: baseLogger, message })

    case "UsernameIsImmutableError":
      message = "username is immutable"
      return new UsernameError({ logger: baseLogger, message })

    case "TwoFANeedToBeSetBeforeDeletionError":
      message = "TwoFA need to be set before removal"
      return new TwoFAError({ logger: baseLogger, message })

    case "TwoFAAlreadySetError":
      message = "TwoFA is already set"
      return new TwoFAError({ logger: baseLogger, message })

    case "RebalanceNeededError":
      return new RebalanceNeededError({ logger: baseLogger })

    // ----------
    // Unhandled below here
    // ----------
    case "RateLimiterExceededError":
    case "RateLimitError":
    case "RateLimitServiceError":
    case "UnknownRateLimitServiceError":
    case "CouldNotFindUserError":
    case "TwoFAError":
    case "LedgerError":
    case "LedgerServiceError":
    case "LightningError":
    case "BadPaymentDataError":
    case "LnInvoiceDecodeError":
    case "LightningServiceError":
    case "CouldNotDecodeReturnedPaymentRequest":
    case "InvoiceNotFoundError":
    case "LnPaymentPendingError":
    case "LnAlreadyPaidError":
    case "PaymentNotFoundError":
    case "InconsistentDataError":
    case "AuthorizationError":
    case "RepositoryError":
    case "PersistError":
    case "DuplicateError":
    case "CouldNotFindError":
    case "ValidationError":
    case "LnRouteValidationError":
    case "BadAmountForRouteError":
    case "InvalidUsername":
    case "InvalidPhoneNumber":
    case "InvalidWalletId":
    case "LessThanDustThresholdError":
    case "InvalidTargetConfirmations":
    case "NoContactForUsernameError":
    case "NoWalletExistsForUserError":
    case "LimitsExceededError":
    case "CouldNotFindWalletFromIdError":
    case "CouldNotListWalletsFromAccountIdError":
    case "CouldNotFindWalletFromUsernameError":
    case "CouldNotFindWalletFromOnChainAddressError":
    case "CouldNotFindWalletFromOnChainAddressesError":
    case "CouldNotFindLnPaymentFromHashError":
    case "LockError":
    case "LockServiceError":
    case "UnknownLockServiceError":
    case "PriceError":
    case "PriceServiceError":
    case "PriceNotAvailableError":
    case "PriceHistoryNotAvailableError":
    case "UnknownPriceServiceError":
    case "OnChainError":
    case "TransactionDecodeError":
    case "OnChainServiceError":
    case "UnknownOnChainServiceError":
    case "CouldNotFindOnChainTransactionError":
    case "OnChainServiceUnavailableError":
    case "NotificationsError":
    case "NotificationsServiceError":
    case "AccountError":
    case "ApiKeyError":
    case "ApiKeyHashError":
    case "InvalidApiKeyError":
    case "InvalidExpirationError":
    case "IpFetcherError":
    case "IpFetcherServiceError":
    case "UnknownIpFetcherServiceError":
    case "CouldNotFindTransactionError":
    case "InvalidLedgerTransactionId":
    case "CacheError":
    case "LocalCacheNotAvailableError":
    case "LocalCacheServiceError":
    case "LocalCacheUndefinedError":
    case "UnknownLocalCacheServiceError":
    case "UserPhoneCodeAttemptPhoneMinIntervalRateLimiterExceededError":
    case "PhoneProviderServiceError":
    case "UnknownPhoneProviderServiceError":
    case "MissingPhoneMetadataError":
    case "InvalidPhoneMetadataTypeError":
    case "InvalidAccountStatusError":
    case "InvalidOnChainAddress":
    case "InvalidScanDepthAmount":
    case "InsufficientBalanceForRoutingError":
    case "InvalidLanguageError":
    case "InvalidWithdrawFeeError":
    case "InvalidUsdCents":
    case "NonIntegerError":
    case "ColdStorageError":
    case "ColdStorageServiceError":
    case "InvalidCurrentColdStorageWalletServiceError":
    case "InsufficientBalanceForRebalanceError":
    case "InvalidOrNonWalletTransactionError":
    case "UnknownColdStorageServiceError":
    case "FeeDifferenceError":
    case "NoTransactionToSettleError":
    case "CorruptLndDbError":
    case "NotImplementedError":
    case "NotReachableError":
    case "DealerPriceError":
    case "DealerPriceServiceError":
    case "UnknownDealerPriceServiceError":
    case "InvalidNegativeAmountError":
    case "DomainError":
    case "ErrorLevel":
    case "InvalidCurrencyBaseAmountError":
      message = `Unknown error occurred (code: ${error.name})`
      return new UnknownClientError({ message, logger: baseLogger })

    default:
      return assertUnreachable(errorName)
  }
}
