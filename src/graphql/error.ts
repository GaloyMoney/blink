import { ApolloError } from "apollo-server-errors"

import { getOnChainWalletConfig } from "@config"

import { baseLogger } from "@services/logger"

const onChainWalletConfig = getOnChainWalletConfig()

export class CustomApolloError extends ApolloError {
  log: LogFn
  forwardToClient: boolean

  constructor({
    message,
    code,
    forwardToClient,
    logger,
    level,
    ...metadata
  }: CustomApolloErrorData & { code: string }) {
    super(message ?? code, code, metadata)
    this.log = logger[level || "warn"].bind(logger)
    this.forwardToClient = forwardToClient || false
  }
}

export class TransactionRestrictedError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({ code: "TRANSACTION_RESTRICTED", forwardToClient: true, ...errData })
  }
}

export class UnknownClientError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({ code: "UNKNOWN_CLIENT_ERROR", forwardToClient: true, ...errData })
  }
}

export class UnexpectedClientError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({ code: "UNEXPECTED_CLIENT_ERROR", forwardToClient: true, ...errData })
  }
}

export class InsufficientBalanceError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: "INSUFFICIENT_BALANCE",
      message: "balance is too low",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class SelfPaymentError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: "CANT_PAY_SELF",
      message: "User tried to pay themselves",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class ValidationInternalError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({ code: "INVALID_INPUT", forwardToClient: true, ...errData })
  }
}

export class InputValidationError extends CustomApolloError {
  constructor(errData: PartialBy<CustomApolloErrorData, "logger" | "forwardToClient">) {
    super({
      code: "INVALID_INPUT",
      forwardToClient: true,
      ...errData,
      logger: baseLogger,
    })
  }
}

export class NotFoundError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({ code: "NOT_FOUND", forwardToClient: true, ...errData })
  }
}

export class NewAccountWithdrawalError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: "NEW_ACCOUNT_WITHDRAWAL_RESTRICTED",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class TooManyRequestError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: "TOO_MANY_REQUEST",
      message: "Too many requests",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class DbError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({ code: "DB_ERROR", forwardToClient: true, ...errData })
  }
}

export class LightningPaymentError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({ code: "LIGHTNING_PAYMENT_ERROR", forwardToClient: true, ...errData })
  }
}

export class OnChainPaymentError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({ code: "ONCHAIN_PAYMENT_ERROR", forwardToClient: true, ...errData })
  }
}

export class RouteFindingError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: "ROUTE_FINDING_ERROR",
      message: "Unable to find a route for payment",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class RebalanceNeededError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: "REBALANCE_NEEDED",
      message: "Insufficient onchain balance on lnd",
      level: "error",
      forwardToClient: false,
      ...errData,
    })
  }
}

export class DustAmountError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: "ENTERED_DUST_AMOUNT",
      message: `Use lightning to send amounts less than ${onChainWalletConfig.dustThreshold}`,
      forwardToClient: true,
      ...errData,
    })
  }
}

export class LndOfflineError extends CustomApolloError {
  constructor(errData: PartialBy<CustomApolloErrorData, "logger" | "forwardToClient">) {
    super({ code: "LND_OFFLINE", forwardToClient: true, ...errData, logger: baseLogger })
  }
}

export class DealerOfflineError extends CustomApolloError {
  constructor(errData: PartialBy<CustomApolloErrorData, "logger" | "forwardToClient">) {
    super({
      code: "DEALER_OFFLINE",
      forwardToClient: true,
      ...errData,
      logger: baseLogger,
    })
  }
}

export class CaptchaFailedError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Unable to estimate onchain fee",
      forwardToClient: true,
      code: "REJECTED_CAPTCHA_FAILED",
      ...errData,
    })
  }
}

export class OnChainFeeEstimationError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Unable to estimate onchain fee",
      forwardToClient: true,
      code: "ONCHAIN_FEE_ESTIMATION_ERROR",
      ...errData,
    })
  }
}

export class TwoFAError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Incorrect code",
      forwardToClient: true,
      code: "2FA_ERROR",
      ...errData,
    })
  }
}

export class InvoiceDecodeError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Unable to decode invoice",
      forwardToClient: true,
      code: "INVOICE_DECODE_ERROR",
      ...errData,
    })
  }
}

export class PhoneCodeError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Incorrect phone code",
      forwardToClient: true,
      code: "PHONE_CODE_ERROR",
      ...errData,
    })
  }
}

export class PhoneProviderError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Issue with phone provider",
      forwardToClient: true,
      code: "PHONE_PROVIDER_ERROR",
      ...errData,
    })
  }
}

export class InvalidCoordinatesError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Latitude must be between -90 and 90 and longitude between -180 and 180",
      forwardToClient: true,
      code: "INVALID_COORDINATES",
      ...errData,
    })
  }
}

export class InvalidBusinessTitleLengthError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Title should be between 3 and 100 characters long",
      forwardToClient: true,
      code: "INVALID_TITLE",
      ...errData,
    })
  }
}

export class UsernameError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Username issue",
      forwardToClient: true,
      code: "USERNAME_ERROR",
      ...errData,
    })
  }
}

export class InsufficientLiquidityError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Temporary funds offline issue",
      forwardToClient: true,
      code: "LIQUIDITY_ERROR",
      ...errData,
    })
  }
}

export class AuthenticationError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Not authenticated",
      forwardToClient: true,
      code: "NOT_AUTHENTICATED",
      ...errData,
    })
  }
}

export class AuthorizationError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Not authorized",
      forwardToClient: true,
      code: "NOT_AUTHORIZED",
      ...errData,
    })
  }
}
