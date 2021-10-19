import { ApolloError } from "apollo-server-errors"

import { getOnChainWalletConfig } from "@config/app"

import { baseLogger } from "@services/logger"

const onChainWalletConfig = getOnChainWalletConfig()

export class CustomError extends ApolloError {
  log: LogFn
  forwardToClient: boolean

  constructor({
    message,
    code,
    forwardToClient,
    logger,
    level,
    ...metadata
  }: CustomErrorData & { code: string }) {
    super(message ?? code, code, metadata)
    this.log = logger[level || "warn"].bind(logger)
    this.forwardToClient = forwardToClient || false
  }
}

export class TransactionRestrictedError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({ code: "TRANSACTION_RESTRICTED", forwardToClient: true, ...errData })
  }
}

export class UnknownClientError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({ code: "UNKNOWN_CLIENT_ERROR", forwardToClient: true, ...errData })
  }
}

export class InsufficientBalanceError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({
      code: "INSUFFICIENT_BALANCE",
      message: "balance is too low",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class SelfPaymentError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({
      code: "CANT_PAY_SELF",
      message: "User tried to pay themselves",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class ValidationInternalError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({ code: "INVALID_INPUT", forwardToClient: true, ...errData })
  }
}

export class NotFoundError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({ code: "NOT_FOUND", forwardToClient: true, ...errData })
  }
}

export class NewAccountWithdrawalError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({
      code: "NEW_ACCOUNT_WITHDRAWAL_RESTRICTED",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class TooManyRequestError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({
      code: "TOO_MANY_REQUEST",
      message: "Too many requests",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class DbError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({ code: "DB_ERROR", forwardToClient: true, ...errData })
  }
}

export class LightningPaymentError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({ code: "LIGHTNING_PAYMENT_ERROR", forwardToClient: true, ...errData })
  }
}

export class RouteFindingError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({
      code: "ROUTE_FINDING_ERROR",
      message: "Unable to find a route for payment",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class RebalanceNeededError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({
      code: "REBALANCE_NEEDED",
      message: "Insufficient onchain balance on lnd",
      forwardToClient: false,
      ...errData,
    })
  }
}

export class DustAmountError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({
      code: "ENTERED_DUST_AMOUNT",
      message: `Use lightning to send amounts less than ${onChainWalletConfig.dustThreshold}`,
      forwardToClient: true,
      ...errData,
    })
  }
}

export class LndOfflineError extends CustomError {
  constructor(errData: PartialBy<CustomErrorData, "logger" | "forwardToClient">) {
    super({ code: "LND_OFFLINE", forwardToClient: true, ...errData, logger: baseLogger })
  }
}

export class IPBlacklistedError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({
      forwardToClient: false,
      code: "REJECTED_BLACKLISTED_IP",
      ...errData,
    })
  }
}

export class CaptchaFailedError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({
      message: "Unable to estimate onchain fee",
      forwardToClient: true,
      code: "REJECTED_CAPTCHA_FAILED",
      ...errData,
    })
  }
}

export class OnChainFeeEstimationError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({
      message: "Unable to estimate onchain fee",
      forwardToClient: true,
      code: "ONCHAIN_FEE_ESTIMATION_ERROR",
      ...errData,
    })
  }
}

export class TwoFAError extends CustomError {
  constructor(errData: CustomErrorData) {
    super({
      message: "Incorrect code",
      forwardToClient: true,
      code: "2FA_ERROR",
      ...errData,
    })
  }
}
