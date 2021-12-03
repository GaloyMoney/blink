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
  InvalidTitleLengthError,
} from "@graphql/error"
import { baseLogger } from "@services/logger"

const assertUnreachable = (x: never): never => {
  throw new Error(`This should never compile with ${x}`)
}

export const mapError = (error: ApplicationError): CustomApolloError => {
  const errorName = error.constructor.name as ApplicationErrorKey
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

    case "CouldNotFindUserFromIdError":
      message = `User does not exist for id ${error.message}`
      return new NotFoundError({ message, logger: baseLogger })

    case "CouldNotFindUserFromUsernameError":
      message = `User does not exist for username ${error.message}`
      return new NotFoundError({ message, logger: baseLogger })

    case "CouldNotFindUserFromPhoneError":
      message = `User does not exist for phone ${error.message}`
      return new NotFoundError({ message, logger: baseLogger })

    case "CouldNotFindUserFromWalletIdError":
      message = `User does not exist for wallet-id ${error.message}`
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

    case "InvalidSatoshiAmount":
      message = "A valid satoshi amount is required"
      return new ValidationInternalError({ message, logger: baseLogger })

    case "LnPaymentRequestNonZeroAmountRequiredError":
      message = "Invoice does not have a valid amount to pay"
      return new ValidationInternalError({ message, logger: baseLogger })

    case "LnPaymentRequestZeroAmountRequiredError":
      message = "Invoice must be a zero-amount invoice"
      return new ValidationInternalError({ message, logger: baseLogger })

    case "InvoiceCreateRateLimiterExceededError":
      message = "Too many invoices creation, please wait for a while and try again."
      return new TooManyRequestError({ message, logger: baseLogger })

    case "OnChainAddressCreateRateLimiterExceededError":
      message =
        "Too many onchain addresses creation, please wait for a while and try again."
      return new TooManyRequestError({ message, logger: baseLogger })

    case "CouldNotFindPhoneCodeError":
      message = "Invalid or incorrect phone code entered."
      return new PhoneCodeError({ message, logger: baseLogger })

    case "RouteNotFoundError":
      message = "Unable to find a route for payment."
      return new RouteFindingError({ message, logger: baseLogger })

    case "InsufficientBalanceForRoutingError":
      message = "Insufficient balance for finding a route."
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
      return new InvalidCoordinatesError({ message, logger: baseLogger })

    case "InvalidTitleLengthError":
      return new InvalidTitleLengthError({ message, logger: baseLogger })

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
    case "InvalidUsername":
    case "InvalidPhoneNumber":
    case "InvalidPublicWalletId":
    case "LessThanDustThresholdError":
    case "InvalidTargetConfirmations":
    case "NoContactForUsernameError":
    case "NoWalletExistsForUserError":
    case "LimitsExceededError":
    case "CouldNotFindWalletFromIdError":
    case "CouldNotFindWalletFromUsernameError":
    case "CouldNotFindWalletFromOnChainAddressError":
    case "CouldNotFindWalletFromPublicIdError":
    case "CouldNotFindWalletFromOnChainAddressesError":
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
    case "UserLoginIpRateLimiterExceededError":
    case "UserLoginPhoneRateLimiterExceededError":
    case "UserPhoneCodeAttemptPhoneRateLimiterExceededError":
    case "UserPhoneCodeAttemptIpRateLimiterExceededError":
    case "PhoneProviderServiceError":
    case "UnknownPhoneProviderServiceError":
      message = `Unknown error occurred (code: ${error.name})`
      return new UnknownClientError({ message, logger: baseLogger })

    default:
      return assertUnreachable(errorName)
  }
}
