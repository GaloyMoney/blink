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
} from "@core/error"

import * as DomainErrors from "@domain/errors"
import * as DomainLightningErrors from "@domain/bitcoin/lightning/errors"
import * as DomainLedgerErrors from "@domain/ledger/errors"
import * as DomainTwoFAErrors from "@domain/twoFA/errors"
import { baseLogger } from "@services/logger"

const AllDomainErrors = {
  ...DomainErrors,
  ...DomainLightningErrors,
  ...DomainLedgerErrors,
  ...DomainTwoFAErrors,
}

const assertUnreachable = (x: never): never => {
  throw new Error(`This should never compile with ${x}`)
}

export const mapError = (error: ApplicationError): CustomError => {
  let message = ""
  const errorName = error.constructor.name as keyof typeof AllDomainErrors
  switch (errorName) {
    case "WithdrawalLimitsExceededError":
      message = error.message
      return new TransactionRestrictedError(message, { logger: baseLogger })

    case "IntraledgerLimitsExceededError":
      message = error.message
      return new TransactionRestrictedError(message, { logger: baseLogger })

    case "TwoFANewCodeNeededError":
      message = "Need a 2FA code to proceed with the payment"
      return new TwoFAError(message, {
        logger: baseLogger,
      })

    case "AlreadyPaidError":
      message = "Invoice is already paid"
      return new LightningPaymentError(message, { logger: baseLogger })

    case "CouldNotFindWalletInvoiceError":
      message = `User tried to pay invoice with hash ${error.message}, but it does not exist`
      return new LightningPaymentError(message, { logger: baseLogger })

    case "CouldNotFindUserFromIdError":
      message = `User does not exist for id ${error.message}`
      return new NotFoundError(message, { logger: baseLogger })

    case "CouldNotFindUserFromUsernameError":
      message = `User does not exist for username ${error.message}`
      return new NotFoundError(message, { logger: baseLogger })

    case "CouldNotFindUserFromWalletIdError":
      message = `User does not exist for wallet-id ${error.message}`
      return new NotFoundError(message, { logger: baseLogger })

    case "SelfPaymentError":
      message = "User tried to pay themselves"
      return new SelfPaymentError(message, { logger: baseLogger })

    case "InsufficientBalanceError":
      return new InsufficientBalanceError(message, { logger: baseLogger })

    case "UnknownLedgerError":
      return new DbError(message, { logger: baseLogger, level: "fatal" })

    case "UnknownLightningServiceError":
      return new LightningPaymentError(message, { logger: baseLogger })

    // ----------
    // Unhandled below here
    // ----------

    case "CouldNotFindUserError":
      return new UnknownClientError(message)

    case "TwoFAError":
      return new UnknownClientError(message)

    case "TwoFAValidationError":
      return new UnknownClientError(message)

    case "UnknownTwoFAError":
      return new UnknownClientError(message)

    case "LedgerError":
      return new UnknownClientError(message)

    case "LedgerServiceError":
      return new UnknownClientError(message)

    case "LightningError":
      return new UnknownClientError(message)

    case "LnInvoiceDecodeError":
      return new UnknownClientError(message)

    case "LightningServiceError":
      return new UnknownClientError(message)

    case "CouldNotDecodeReturnedPaymentRequest":
      return new UnknownClientError(message)

    case "InvoiceNotFoundError":
      return new UnknownClientError(message)

    case "LnPaymentPendingError":
      return new UnknownClientError(message)

    case "LnAlreadyPaidError":
      return new UnknownClientError(message)

    case "NoValidNodeForPubkeyError":
      return new UnknownClientError(message)

    case "PaymentNotFoundError":
      return new UnknownClientError(message)

    case "InconsistentDataError":
      return new UnknownClientError(message)

    case "AuthorizationError":
      return new UnknownClientError(message)

    case "RepositoryError":
      return new UnknownClientError(message)

    case "UnknownRepositoryError":
      return new UnknownClientError(message)

    case "PersistError":
      return new UnknownClientError(message)

    case "DuplicateError":
      return new UnknownClientError(message)

    case "CouldNotFindError":
      return new UnknownClientError(message)

    case "ValidationError":
      return new UnknownClientError(message)

    case "InvalidSatoshiAmount":
      return new UnknownClientError(message)

    case "SatoshiAmountRequiredError":
      return new UnknownClientError(message)

    case "InvalidUsername":
      return new UnknownClientError(message)

    case "InvalidPublicWalletId":
      return new UnknownClientError(message)

    case "LessThanDustThresholdError":
      return new UnknownClientError(message)

    case "InvalidTargetConfirmations":
      return new UnknownClientError(message)

    case "NoContactForUsernameError":
      return new UnknownClientError(message)

    case "LnPaymentRequestNonZeroAmountRequiredError":
      return new UnknownClientError(message)

    case "LnPaymentRequestZeroAmountRequiredError":
      return new UnknownClientError(message)

    case "NoWalletExistsForUserError":
      return new UnknownClientError(message)

    case "LimitsExceededError":
      return new UnknownClientError(message)

    case "TwoFALimitsExceededError":
      return new UnknownClientError(message)

    case "CouldNotFindWalletFromIdError":
      return new UnknownClientError(message)

    case "CouldNotFindWalletFromUsernameError":
      return new UnknownClientError(message)

    case "CouldNotFindWalletFromOnChainAddressError":
      return new UnknownClientError(message)

    case "CouldNotFindWalletFromPublicIdError":
      return new UnknownClientError(message)

    case "CouldNotFindWalletFromOnChainAddressesError":
      return new UnknownClientError(message)

    default:
      return assertUnreachable(errorName)
  }
}
