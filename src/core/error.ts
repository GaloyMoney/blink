import { ApolloError } from "apollo-server-errors"
import { Logger } from "pino"

import { getOnChainWalletConfig } from "@config/app"

import { baseLogger } from "@services/logger"

const onChainWalletConfig = getOnChainWalletConfig()

type levelType = "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent"
export class CustomError extends ApolloError {
  log
  forwardToClient

  constructor(
    message: string,
    code: string,
    {
      forwardToClient,
      logger,
      level,
      metadata,
    }: { forwardToClient: boolean; logger: Logger; metadata; level: levelType },
  ) {
    super(message, code, { metadata })
    this.log = logger[level].bind(logger)
    this.forwardToClient = forwardToClient
  }
}

export class TransactionRestrictedError extends CustomError {
  constructor(
    message: string,
    { forwardToClient = true, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "TRANSACTION_RESTRICTED", { forwardToClient, logger, level, metadata })
  }
}

export class InsufficientBalanceError extends CustomError {
  constructor(
    message = `balance is too low`,
    { forwardToClient = true, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "INSUFFICIENT_BALANCE", { forwardToClient, logger, level, metadata })
  }
}

export class SelfPaymentError extends CustomError {
  constructor(
    message = "User tried to pay themselves",
    { forwardToClient = true, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "CANT_PAY_SELF", { forwardToClient, logger, level, metadata })
  }
}

export class ValidationInternalError extends CustomError {
  constructor(
    message: string,
    { forwardToClient = true, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "INVALID_INPUT", { forwardToClient, logger, level, metadata })
  }
}

export class NotFoundError extends CustomError {
  constructor(
    message: string,
    { forwardToClient = true, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "NOT_FOUND", { forwardToClient, logger, level, metadata })
  }
}

export class NewAccountWithdrawalError extends CustomError {
  constructor(
    message: string,
    { forwardToClient = true, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "NEW_ACCOUNT_WITHDRAWAL_RESTRICTED", {
      forwardToClient,
      logger,
      level,
      metadata,
    })
  }
}

export class TooManyRequestError extends CustomError {
  constructor({ forwardToClient = true, logger, level = "warn" as const, ...metadata }) {
    const message = "Too many requests"
    super(message, "TOO_MANY_REQUEST", { forwardToClient, logger, level, metadata })
  }
}

export class DbError extends CustomError {
  constructor(message: string, { forwardToClient = true, logger, level, ...metadata }) {
    super(message, "DB_ERROR", { forwardToClient, logger, level, metadata })
  }
}

export class LightningPaymentError extends CustomError {
  constructor(
    message: string,
    { forwardToClient = true, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "LIGHTNING_PAYMENT_ERROR", {
      forwardToClient,
      logger,
      level,
      metadata,
    })
  }
}

export class RouteFindingError extends CustomError {
  constructor(
    message = "Unable to find a route for payment",
    { forwardToClient = true, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "ROUTE_FINDING_ERROR", { forwardToClient, logger, level, metadata })
  }
}

export class RebalanceNeededError extends CustomError {
  constructor(
    message = `Insufficient onchain balance on lnd`,
    { forwardToClient = false, logger, level = "error" as const, ...metadata },
  ) {
    super(message, "REBALANCE_NEEDED", { forwardToClient, logger, level, metadata })
  }
}

export class DustAmountError extends CustomError {
  constructor(
    message = `Use lightning to send amounts less than ${onChainWalletConfig.dustThreshold}`,
    { forwardToClient = true, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "ENTERED_DUST_AMOUNT", { forwardToClient, logger, level, metadata })
  }
}

export class LndOfflineError extends CustomError {
  constructor(
    message,
    {
      forwardToClient = true,
      logger = baseLogger,
      level = "warn" as const,
      ...metadata
    } = {},
  ) {
    super(message, "LND_OFFLINE", { forwardToClient, logger, level, metadata })
  }
}

export class IPBlacklistedError extends CustomError {
  constructor(
    message: string,
    { forwardToClient = false, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "REJECTED_BLACKLISTED_IP", {
      forwardToClient,
      logger,
      level,
      metadata,
    })
  }
}

export class CaptchaFailedError extends CustomError {
  constructor(
    message,
    { forwardToClient = true, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "REJECTED_CAPTCHA_FAILED", {
      forwardToClient,
      logger,
      level,
      metadata,
    })
  }
}

export class OnChainFeeEstimationError extends CustomError {
  constructor(
    message = "Unable to estimate onchain fee",
    // FIXME: Do we want this to be a warning or an error?
    { forwardToClient = true, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "ONCHAIN_FEE_ESTIMATION_ERROR", {
      forwardToClient,
      logger,
      level,
      metadata,
    })
  }
}

export class TwoFAError extends CustomError {
  constructor(
    message = "Incorrect code",
    { forwardToClient = true, logger, level = "warn" as const, ...metadata },
  ) {
    super(message, "2FA_ERROR", { forwardToClient, logger, level, metadata })
  }
}
