import {
  CustomError,
  TransactionRestrictedError,
  LightningPaymentError,
  UnknownClientError,
  TwoFAError,
  NotFoundError,
  SelfPaymentError,
  InsufficientBalanceError,
  DbError,
} from "@core/error"
import { UnknownLightningServiceError } from "@domain/bitcoin/lightning"
import {
  AlreadyPaidError,
  CouldNotFindUserError,
  CouldNotFindWalletInvoiceError,
  InsufficientBalanceError as DomainInsufficientBalanceError,
  IntraledgerLimitsExceededError,
  SelfPaymentError as DomainSelfPaymentError,
  WithdrawalLimitsExceededError,
} from "@domain/errors"
import { UnknownLedgerError } from "@domain/ledger"
import { TwoFANewCodeNeededError } from "@domain/twoFA"
import { baseLogger } from "@services/logger"

export const mapError = (error: Error): CustomError => {
  switch (error.constructor) {
    case WithdrawalLimitsExceededError:
      return new TransactionRestrictedError(error.message, { logger: baseLogger })

    case IntraledgerLimitsExceededError:
      return new TransactionRestrictedError(error.message, { logger: baseLogger })

    case TwoFANewCodeNeededError:
      return new TwoFAError(error.message, { logger: baseLogger })

    case AlreadyPaidError:
      return new LightningPaymentError(error.message, { logger: baseLogger })

    case CouldNotFindWalletInvoiceError:
      return new LightningPaymentError(error.message, { logger: baseLogger })

    case CouldNotFindUserError:
      return new NotFoundError(error.message, { logger: baseLogger })

    case DomainSelfPaymentError:
      return new SelfPaymentError(error.message, { logger: baseLogger })

    case DomainInsufficientBalanceError:
      return new InsufficientBalanceError(error.message, { logger: baseLogger })

    case UnknownLedgerError:
      return new DbError(error.message, { logger: baseLogger, level: "fatal" })

    case UnknownLightningServiceError:
      return new LightningPaymentError(error.message, { logger: baseLogger })

    default:
      return new UnknownClientError(error.message, { logger: baseLogger })
  }
}
