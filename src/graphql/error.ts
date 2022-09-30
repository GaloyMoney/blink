import { ApolloError } from "apollo-server-errors"

import { getOnChainWalletConfig } from "@config"

import { baseLogger } from "@services/logger"

const onChainWalletConfig = getOnChainWalletConfig()

export const CustomApolloErrorCode = {
  TRANSACTION_RESTRICTED: "TRANSACTION_RESTRICTED",
  UNKNOWN_CLIENT_ERROR: "UNKNOWN_CLIENT_ERROR",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  CANT_PAY_SELF: "CANT_PAY_SELF",
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_OUTPUT: "INVALID_OUTPUT",
  NOT_FOUND: "NOT_FOUND",
  NEW_ACCOUNT_WITHDRAWAL_RESTRICTED: "NEW_ACCOUNT_WITHDRAWAL_RESTRICTED",
  TOO_MANY_REQUEST: "TOO_MANY_REQUEST",
  DB_ERROR: "DB_ERROR",
  LIGHTNING_PAYMENT_ERROR: "LIGHTNING_PAYMENT_ERROR",
  ONCHAIN_PAYMENT_ERROR: "ONCHAIN_PAYMENT_ERROR",
  ROUTE_FINDING_ERROR: "ROUTE_FINDING_ERROR",
  REBALANCE_NEEDED: "REBALANCE_NEEDED",
  ENTERED_DUST_AMOUNT: "ENTERED_DUST_AMOUNT",
  LND_OFFLINE: "LND_OFFLINE",
  DEALER_OFFLINE: "DEALER_OFFLINE",
  REJECTED_CAPTCHA_FAILED: "REJECTED_CAPTCHA_FAILED",
  ONCHAIN_FEE_ESTIMATION_ERROR: "ONCHAIN_FEE_ESTIMATION_ERROR",
  TWOFA_ERROR: "2FA_ERROR",
  INVOICE_DECODE_ERROR: "INVOICE_DECODE_ERROR",
  PHONE_CODE_ERROR: "PHONE_CODE_ERROR",
  PHONE_PROVIDER_ERROR: "PHONE_PROVIDER_ERROR",
  INVALID_COORDINATES: "INVALID_COORDINATES",
  INVALID_TITLE: "INVALID_TITLE",
  USERNAME_ERROR: "USERNAME_ERROR",
  LIQUIDITY_ERROR: "LIQUIDITY_ERROR",
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
} as const

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
    super({
      code: CustomApolloErrorCode.TRANSACTION_RESTRICTED,
      forwardToClient: true,
      ...errData,
    })
  }
}

export class UnknownClientError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: CustomApolloErrorCode.UNKNOWN_CLIENT_ERROR,
      forwardToClient: true,
      ...errData,
    })
  }
}

export class InsufficientBalanceError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: CustomApolloErrorCode.INSUFFICIENT_BALANCE,
      message: "balance is too low",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class SelfPaymentError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: CustomApolloErrorCode.CANT_PAY_SELF,
      message: "User tried to pay themselves",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class ValidationInternalError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: CustomApolloErrorCode.INVALID_INPUT,
      forwardToClient: true,
      ...errData,
    })
  }
}

export class InputValidationError extends CustomApolloError {
  constructor(errData: PartialBy<CustomApolloErrorData, "logger" | "forwardToClient">) {
    super({
      code: CustomApolloErrorCode.INVALID_INPUT,
      forwardToClient: true,
      ...errData,
      logger: baseLogger,
    })
  }
}

export class OutputValidationError extends CustomApolloError {
  constructor(errData: PartialBy<CustomApolloErrorData, "logger" | "forwardToClient">) {
    super({
      code: CustomApolloErrorCode.INVALID_OUTPUT,
      forwardToClient: false,
      ...errData,
      logger: baseLogger,
    })
  }
}

export class NotFoundError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({ code: CustomApolloErrorCode.NOT_FOUND, forwardToClient: true, ...errData })
  }
}

export class NewAccountWithdrawalError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: CustomApolloErrorCode.NEW_ACCOUNT_WITHDRAWAL_RESTRICTED,
      forwardToClient: true,
      ...errData,
    })
  }
}

export class TooManyRequestError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: CustomApolloErrorCode.TOO_MANY_REQUEST,
      message: "Too many requests",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class DbError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({ code: CustomApolloErrorCode.DB_ERROR, forwardToClient: true, ...errData })
  }
}

export class LightningPaymentError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: CustomApolloErrorCode.LIGHTNING_PAYMENT_ERROR,
      forwardToClient: true,
      ...errData,
    })
  }
}

export class OnChainPaymentError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: CustomApolloErrorCode.ONCHAIN_PAYMENT_ERROR,
      forwardToClient: true,
      ...errData,
    })
  }
}

export class RouteFindingError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: CustomApolloErrorCode.ROUTE_FINDING_ERROR,
      message: "Unable to find a route for payment",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class RebalanceNeededError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      code: CustomApolloErrorCode.REBALANCE_NEEDED,
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
      code: CustomApolloErrorCode.ENTERED_DUST_AMOUNT,
      message: `Use lightning to send amounts less than ${onChainWalletConfig.dustThreshold}`,
      forwardToClient: true,
      ...errData,
    })
  }
}

export class LndOfflineError extends CustomApolloError {
  constructor(errData: PartialBy<CustomApolloErrorData, "logger" | "forwardToClient">) {
    super({
      code: CustomApolloErrorCode.LND_OFFLINE,
      forwardToClient: true,
      ...errData,
      logger: baseLogger,
    })
  }
}

export class DealerOfflineError extends CustomApolloError {
  constructor(errData: PartialBy<CustomApolloErrorData, "logger" | "forwardToClient">) {
    super({
      code: CustomApolloErrorCode.DEALER_OFFLINE,
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
      code: CustomApolloErrorCode.REJECTED_CAPTCHA_FAILED,
      ...errData,
    })
  }
}

export class OnChainFeeEstimationError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Unable to estimate onchain fee",
      forwardToClient: true,
      code: CustomApolloErrorCode.ONCHAIN_FEE_ESTIMATION_ERROR,
      ...errData,
    })
  }
}

export class TwoFAError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Incorrect code",
      forwardToClient: true,
      code: CustomApolloErrorCode.TWOFA_ERROR,
      ...errData,
    })
  }
}

export class InvoiceDecodeError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Unable to decode invoice",
      forwardToClient: true,
      code: CustomApolloErrorCode.INVOICE_DECODE_ERROR,
      ...errData,
    })
  }
}

export class PhoneCodeError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Incorrect phone code",
      forwardToClient: true,
      code: CustomApolloErrorCode.PHONE_CODE_ERROR,
      ...errData,
    })
  }
}

export class PhoneProviderError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Issue with phone provider",
      forwardToClient: true,
      code: CustomApolloErrorCode.PHONE_PROVIDER_ERROR,
      ...errData,
    })
  }
}

export class InvalidCoordinatesError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Latitude must be between -90 and 90 and longitude between -180 and 180",
      forwardToClient: true,
      code: CustomApolloErrorCode.INVALID_COORDINATES,
      ...errData,
    })
  }
}

export class InvalidBusinessTitleLengthError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Title should be between 3 and 100 characters long",
      forwardToClient: true,
      code: CustomApolloErrorCode.INVALID_TITLE,
      ...errData,
    })
  }
}

export class UsernameError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Username issue",
      forwardToClient: true,
      code: CustomApolloErrorCode.USERNAME_ERROR,
      ...errData,
    })
  }
}

export class InsufficientLiquidityError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Temporary funds offline issue",
      forwardToClient: true,
      code: CustomApolloErrorCode.LIQUIDITY_ERROR,
      ...errData,
    })
  }
}

export class AuthenticationError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Not authenticated",
      forwardToClient: true,
      code: CustomApolloErrorCode.NOT_AUTHENTICATED,
      ...errData,
    })
  }
}

export class AuthorizationError extends CustomApolloError {
  constructor(errData: CustomApolloErrorData) {
    super({
      message: "Not authorized",
      forwardToClient: true,
      code: CustomApolloErrorCode.NOT_AUTHORIZED,
      ...errData,
    })
  }
}
