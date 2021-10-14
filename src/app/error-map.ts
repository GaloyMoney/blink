import {
  CustomError,
  TransactionRestrictedError,
  LightningPaymentError,
  TwoFAError,
  NotFoundError,
  SelfPaymentError,
  InsufficientBalanceError,
  DbError,
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

    default:
      return assertUnreachable(errorName)
  }
}
