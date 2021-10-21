import {
  CustomError,
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
} from "@graphql/error"

import * as DomainErrors from "@domain/errors"
import * as LedgerErrors from "@domain/ledger/errors"
import * as OnChainErrors from "@domain/bitcoin/onchain/errors"
import * as LightningErrors from "@domain/bitcoin/lightning/errors"
import * as PriceServiceErrors from "@domain/price/errors"
import * as TwoFAErrors from "@domain/twoFA/errors"
import * as LockServiceErrors from "@domain/lock/errors"
import * as IpFetcherErrors from "@domain/ipfetcher/errors"
import * as AccountErrors from "@domain/accounts/errors"
import * as NotificationsErrors from "@domain/notifications/errors"

import { baseLogger } from "@services/logger"

const AllApplicationErrors = {
  ...DomainErrors,
  ...LedgerErrors,
  ...OnChainErrors,
  ...LightningErrors,
  ...PriceServiceErrors,
  ...TwoFAErrors,
  ...LockServiceErrors,
  ...IpFetcherErrors,
  ...AccountErrors,
  ...NotificationsErrors,
}

const assertUnreachable = (x: never): never => {
  throw new Error(`This should never compile with ${x}`)
}

export const mapError = (error: ApplicationError): CustomError => {
  let message = ""
  const errorName = error.constructor.name as keyof typeof AllApplicationErrors
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

    case "CouldNotFindUserFromIdError":
      message = `User does not exist for id ${error.message}`
      return new NotFoundError({ message, logger: baseLogger })

    case "CouldNotFindUserFromUsernameError":
      message = `User does not exist for username ${error.message}`
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

    case "LnPaymentRequestNonZeroAmountRequiredError":
      message = "Invoice does not have a valid amount to pay"
      return new ValidationInternalError({ message, logger: baseLogger })

    case "LnPaymentRequestZeroAmountRequiredError":
      message = "Invoice must be a zero-amount invoice"
      return new ValidationInternalError({ message, logger: baseLogger })

    case "UnknownLnInvoiceDecodeError":
      return new InvoiceDecodeError({ message, logger: baseLogger })

    case "UnknownRepositoryError":
      return new DbError({ message, logger: baseLogger, level: "fatal" })

    case "UnknownLedgerError":
      return new DbError({ message, logger: baseLogger, level: "fatal" })

    case "UnknownLightningServiceError":
      return new LightningPaymentError({ message, logger: baseLogger })

    case "UnknownTwoFAError":
      return new TwoFAError({ message, logger: baseLogger })

    // ----------
    // Unhandled below here
    // ----------

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
    case "NoValidNodeForPubkeyError":
    case "PaymentNotFoundError":
    case "InconsistentDataError":
    case "AuthorizationError":
    case "RepositoryError":
    case "PersistError":
    case "DuplicateError":
    case "CouldNotFindError":
    case "ValidationError":
    case "InvalidSatoshiAmount":
    case "InvalidUsername":
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
      return new UnknownClientError({ message, logger: baseLogger })

    default:
      return assertUnreachable(errorName)
  }
}
