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
      return new UnknownClientError({ message, logger: baseLogger })

    case "TwoFAError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "LedgerError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "LedgerServiceError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "LightningError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "LnInvoiceDecodeError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "LightningServiceError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "CouldNotDecodeReturnedPaymentRequest":
      return new UnknownClientError({ message, logger: baseLogger })

    case "InvoiceNotFoundError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "LnPaymentPendingError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "LnAlreadyPaidError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "NoValidNodeForPubkeyError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "PaymentNotFoundError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "InconsistentDataError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "AuthorizationError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "RepositoryError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "PersistError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "DuplicateError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "CouldNotFindError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "ValidationError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "InvalidSatoshiAmount":
      return new UnknownClientError({ message, logger: baseLogger })

    case "InvalidUsername":
      return new UnknownClientError({ message, logger: baseLogger })

    case "InvalidPublicWalletId":
      return new UnknownClientError({ message, logger: baseLogger })

    case "LessThanDustThresholdError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "InvalidTargetConfirmations":
      return new UnknownClientError({ message, logger: baseLogger })

    case "NoContactForUsernameError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "NoWalletExistsForUserError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "LimitsExceededError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "CouldNotFindWalletFromIdError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "CouldNotFindWalletFromUsernameError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "CouldNotFindWalletFromOnChainAddressError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "CouldNotFindWalletFromPublicIdError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "CouldNotFindWalletFromOnChainAddressesError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "LockError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "LockServiceError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "UnknownLockServiceError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "PriceError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "PriceServiceError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "UnknownPriceServiceError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "OnChainError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "TransactionDecodeError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "OnChainServiceError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "UnknownOnChainServiceError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "OnChainServiceUnavailableError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "NotificationsError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "NotificationsServiceError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "AccountError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "ApiKeyError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "ApiKeyHashError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "InvalidApiKeyError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "InvalidExpirationError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "IpFetcherError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "IpFetcherServiceError":
      return new UnknownClientError({ message, logger: baseLogger })

    case "UnknownIpFetcherServiceError":
      return new UnknownClientError({ message, logger: baseLogger })

    default:
      return assertUnreachable(errorName)
  }
}
