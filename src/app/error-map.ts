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

function assertUnreachable(x: never): never {
  throw new Error(`Didn't expect to get here with ${x}`)
}

export const mapError = (error: ApplicationError): CustomError => {
  const errorName = error.constructor.name as keyof typeof AllDomainErrors
  switch (errorName) {
    case "WithdrawalLimitsExceededError":
      return new TransactionRestrictedError(error.message, { logger: baseLogger })

    case "IntraledgerLimitsExceededError":
      return new TransactionRestrictedError(error.message, { logger: baseLogger })

    case "TwoFANewCodeNeededError":
      return new TwoFAError(error.message, { logger: baseLogger })

    case "AlreadyPaidError":
      return new LightningPaymentError(error.message, { logger: baseLogger })

    case "CouldNotFindWalletInvoiceError":
      return new LightningPaymentError(error.message, { logger: baseLogger })

    case "CouldNotFindUserError":
      return new NotFoundError(error.message, { logger: baseLogger })

    case "SelfPaymentError":
      return new SelfPaymentError(error.message, { logger: baseLogger })

    case "InsufficientBalanceError":
      return new InsufficientBalanceError(error.message, { logger: baseLogger })

    case "UnknownLedgerError":
      return new DbError(error.message, { logger: baseLogger, level: "fatal" })

    case "UnknownLightningServiceError":
      return new LightningPaymentError(error.message, { logger: baseLogger })

    // ----------
    // Unhandled below here
    // ----------

    case "TwoFAError":
      return new UnknownClientError(error.message)

    case "TwoFAValidationError":
      return new UnknownClientError(error.message)

    case "UnknownTwoFAError":
      return new UnknownClientError(error.message)

    case "LedgerError":
      return new UnknownClientError(error.message)

    case "LedgerServiceError":
      return new UnknownClientError(error.message)

    case "LightningError":
      return new UnknownClientError(error.message)

    case "LnInvoiceDecodeError":
      return new UnknownClientError(error.message)

    case "LightningServiceError":
      return new UnknownClientError(error.message)

    case "CouldNotDecodeReturnedPaymentRequest":
      return new UnknownClientError(error.message)

    case "InvoiceNotFoundError":
      return new UnknownClientError(error.message)

    case "LnPaymentPendingError":
      return new UnknownClientError(error.message)

    case "LnAlreadyPaidError":
      return new UnknownClientError(error.message)

    case "NoValidNodeForPubkeyError":
      return new UnknownClientError(error.message)

    case "PaymentNotFoundError":
      return new UnknownClientError(error.message)

    case "InconsistentDataError":
      return new UnknownClientError(error.message)

    case "AuthorizationError":
      return new UnknownClientError(error.message)

    case "RepositoryError":
      return new UnknownClientError(error.message)

    case "UnknownRepositoryError":
      return new UnknownClientError(error.message)

    case "PersistError":
      return new UnknownClientError(error.message)

    case "DuplicateError":
      return new UnknownClientError(error.message)

    case "CouldNotFindError":
      return new UnknownClientError(error.message)

    case "ValidationError":
      return new UnknownClientError(error.message)

    case "InvalidSatoshiAmount":
      return new UnknownClientError(error.message)

    case "SatoshiAmountRequiredError":
      return new UnknownClientError(error.message)

    case "InvalidUsername":
      return new UnknownClientError(error.message)

    case "InvalidPublicWalletId":
      return new UnknownClientError(error.message)

    case "LessThanDustThresholdError":
      return new UnknownClientError(error.message)

    case "InvalidTargetConfirmations":
      return new UnknownClientError(error.message)

    case "NoContactForUsernameError":
      return new UnknownClientError(error.message)

    case "LnPaymentRequestNonZeroAmountRequiredError":
      return new UnknownClientError(error.message)

    case "LnPaymentRequestZeroAmountRequiredError":
      return new UnknownClientError(error.message)

    case "NoWalletExistsForUserError":
      return new UnknownClientError(error.message)

    case "LimitsExceededError":
      return new UnknownClientError(error.message)

    case "TwoFALimitsExceededError":
      return new UnknownClientError(error.message)

    case "CouldNotFindUserFromIdError":
      return new UnknownClientError(error.message)

    case "CouldNotFindUserFromUsernameError":
      return new UnknownClientError(error.message)

    case "CouldNotFindUserFromWalletIdError":
      return new UnknownClientError(error.message)

    case "CouldNotFindWalletFromIdError":
      return new UnknownClientError(error.message)

    case "CouldNotFindWalletFromUsernameError":
      return new UnknownClientError(error.message)

    case "CouldNotFindWalletFromOnChainAddressError":
      return new UnknownClientError(error.message)

    case "CouldNotFindWalletFromPublicIdError":
      return new UnknownClientError(error.message)

    case "CouldNotFindWalletFromOnChainAddressesError":
      return new UnknownClientError(error.message)

    default:
      return assertUnreachable(errorName)
  }
}
