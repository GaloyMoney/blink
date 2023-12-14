import { GraphQLError } from "graphql"

import { getOnChainWalletConfig } from "@/config"

import { baseLogger } from "@/services/logger"

const onChainWalletConfig = getOnChainWalletConfig()

export class CustomGraphQLError extends GraphQLError {
  log: LogFn
  forwardToClient: boolean

  constructor({
    message,
    code,
    forwardToClient,
    logger,
    level,
    ...metadata
  }: CustomGraphQLErrorData & { code: string }) {
    const options = { ...metadata }
    options["extensions"] = { ...(options["extensions"] || {}), code }
    super(message ?? code, options)
    this.log = logger[level || "warn"].bind(logger)
    this.forwardToClient = forwardToClient || false
  }
}

export class TransactionRestrictedError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({ code: "TRANSACTION_RESTRICTED", forwardToClient: true, ...errData })
  }
}

export class UnknownClientError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({ code: "UNKNOWN_CLIENT_ERROR", forwardToClient: true, ...errData })
  }
}

export class UnexpectedClientError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({ code: "UNEXPECTED_CLIENT_ERROR", forwardToClient: true, ...errData })
  }
}

export class InsufficientBalanceError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      code: "INSUFFICIENT_BALANCE",
      message: "balance is too low",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class SelfPaymentError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      code: "CANT_PAY_SELF",
      message: "User tried to pay themselves",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class LikelyBadCoreError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      ...errData,
      code: "BAD_ERROR_CODE",
      forwardToClient: true,
      message: "An error occurred. It's likely that the code you entered is not correct",
    })
  }
}

export class ValidationInternalError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({ code: "INVALID_INPUT", forwardToClient: true, ...errData })
  }
}

export class InputValidationError extends CustomGraphQLError {
  constructor(errData: PartialBy<CustomGraphQLErrorData, "logger" | "forwardToClient">) {
    super({
      code: "INVALID_INPUT",
      forwardToClient: true,
      ...errData,
      logger: baseLogger,
    })
  }
}

export class NotFoundError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({ code: "NOT_FOUND", forwardToClient: true, ...errData })
  }
}

export class NewAccountWithdrawalError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      code: "NEW_ACCOUNT_WITHDRAWAL_RESTRICTED",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class TooManyRequestError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      code: "TOO_MANY_REQUEST",
      message: "Too many requests",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class DbError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({ code: "DB_ERROR", forwardToClient: true, ...errData })
  }
}

export class LightningPaymentError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({ code: "LIGHTNING_PAYMENT_ERROR", forwardToClient: true, ...errData })
  }
}

export class OnChainPaymentError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({ code: "ONCHAIN_PAYMENT_ERROR", forwardToClient: true, ...errData })
  }
}

export class RouteFindingError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      code: "ROUTE_FINDING_ERROR",
      message: "Unable to find a route for payment",
      forwardToClient: true,
      ...errData,
    })
  }
}

export class DustAmountError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      code: "ENTERED_DUST_AMOUNT",
      message: `Use lightning to send amounts less than ${onChainWalletConfig.dustThreshold} sats`,
      forwardToClient: true,
      ...errData,
    })
  }
}

export class LndOfflineError extends CustomGraphQLError {
  constructor(errData: PartialBy<CustomGraphQLErrorData, "logger" | "forwardToClient">) {
    super({ code: "LND_OFFLINE", forwardToClient: true, ...errData, logger: baseLogger })
  }
}

export class DealerError extends CustomGraphQLError {
  constructor(errData: PartialBy<CustomGraphQLErrorData, "logger" | "forwardToClient">) {
    super({
      code: "DEALER_ERROR",
      forwardToClient: true,
      ...errData,
      logger: baseLogger,
    })
  }
}

export class DealerOfflineError extends CustomGraphQLError {
  constructor(errData: PartialBy<CustomGraphQLErrorData, "logger" | "forwardToClient">) {
    super({
      code: "DEALER_OFFLINE",
      forwardToClient: true,
      ...errData,
      logger: baseLogger,
    })
  }
}

export class CaptchaFailedError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Unable to estimate onchain fee",
      forwardToClient: true,
      code: "REJECTED_CAPTCHA_FAILED",
      ...errData,
    })
  }
}

export class OnChainFeeEstimationError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Unable to estimate onchain fee",
      forwardToClient: true,
      code: "ONCHAIN_FEE_ESTIMATION_ERROR",
      ...errData,
    })
  }
}

export class InvoiceDecodeError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Unable to decode invoice",
      forwardToClient: true,
      code: "INVOICE_DECODE_ERROR",
      ...errData,
    })
  }
}

export class VerificationCodeError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Incorrect phone code",
      forwardToClient: true,
      code: "PHONE_CODE_ERROR",
      ...errData,
    })
  }
}

export class PhoneProviderError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Issue with phone provider",
      forwardToClient: true,
      code: "PHONE_PROVIDER_ERROR",
      ...errData,
    })
  }
}

export class InvalidCoordinatesError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Latitude must be between -90 and 90 and longitude between -180 and 180",
      forwardToClient: true,
      code: "INVALID_COORDINATES",
      ...errData,
    })
  }
}

export class InvalidBusinessTitleLengthError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Title should be between 3 and 100 characters long",
      forwardToClient: true,
      code: "INVALID_TITLE",
      ...errData,
    })
  }
}

export class UsernameError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Username issue",
      forwardToClient: true,
      code: "USERNAME_ERROR",
      ...errData,
    })
  }
}

export class InsufficientLiquidityError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Temporary funds offline issue",
      forwardToClient: true,
      code: "LIQUIDITY_ERROR",
      ...errData,
    })
  }
}

export class AuthenticationError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Not authenticated",
      forwardToClient: true,
      code: "NOT_AUTHENTICATED",
      ...errData,
    })
  }
}

export class AuthorizationError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Not authorized",
      forwardToClient: true,
      code: "NOT_AUTHORIZED",
      ...errData,
    })
  }
}

export class PhoneAccountAlreadyExistsError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message:
        "Phone Account already exists. Please logout and log back in with your phone account",
      forwardToClient: true,
      code: "PHONE_ACCOUNT_ALREADY_EXISTS_ERROR",
      ...errData,
    })
  }
}

export class EmailAlreadyExistsError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message:
        "Email account already exists. Please logout and log back in with your email account",
      forwardToClient: true,
      code: "EMAIL_ACCOUNT_ALREADY_EXISTS_ERROR",
      ...errData,
    })
  }
}

export class CodeExpiredError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Code has expired. please ask for a new code and try again",
      forwardToClient: true,
      code: "CODE_EXPIRED_ERROR",
      ...errData,
    })
  }
}

export class SessionRefreshRequiredError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Session refresh required.",
      forwardToClient: true,
      code: "SESSION_REFRESH_REQUIRED_ERROR",
      ...errData,
    })
  }
}

export class UnauthorizedIPForOnboardingError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "This IP address is not allowed to onboard.",
      forwardToClient: true,
      code: "IP_NOT_ALLOWED_TO_ONBOARD_ERROR",
      ...errData,
    })
  }
}

export class InvalidPhoneForOnboardingError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "This phone number is not allowed to onboard.",
      forwardToClient: true,
      code: "PHONE_NOT_ALLOWED_TO_ONBOARD_ERROR",
      ...errData,
    })
  }
}

export class UnauthorizedIPMetadataCountryError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Country not not authorized for rewards.",
      forwardToClient: true,
      code: "UNAUTHORIZED_COUNTRY_IP_FOR_REWARD",
      ...errData,
    })
  }
}

export class UnauthorizedIPMetadataProxyError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "VPN ips are not authorized for rewards.",
      forwardToClient: true,
      code: "UNAUTHORIZED_VPN_IP_FOR_REWARD",
      ...errData,
    })
  }
}

export class UnauthorizedIPError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "This ip is unauthorized for rewards.",
      forwardToClient: true,
      code: "UNAUTHORIZED_IP_FOR_REWARD",
      ...errData,
    })
  }
}

export class InvalidPhoneMetadataForOnboardingError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Error fetching phone information.",
      forwardToClient: true,
      code: "INVALID_PHONE_METADATA_FOR_ONBOARDING_ERROR",
      ...errData,
    })
  }
}

export class PhoneAccountAlreadyExistsNeedToSweepFundsError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message:
        "Error phone account already exists. You need to manually sweep funds to your phone account",
      forwardToClient: true,
      code: "PHONE_ACCOUNT_ALREADY_EXISTS_NEED_TO_SWEEP_FUNDS_ERROR",
      ...errData,
    })
  }
}

export class EmailUnverifiedError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message: "Email is not verified. Please verify your email and try again",
      forwardToClient: true,
      code: "EMAIL_NOT_VERIFIED_ERROR",
      ...errData,
    })
  }
}

export class AccountAlreadyHasEmailError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message:
        "An email is already attached to this account. It's only possible to attach one email per account",
      forwardToClient: true,
      code: "EMAIL_ALREADY_ATTACHED_ERROR",
      ...errData,
    })
  }
}

export class PhoneAlreadyExistsError extends CustomGraphQLError {
  constructor(errData: CustomGraphQLErrorData) {
    super({
      message:
        "A phone is already attached to this account. It's only possible to attach one phone per account",
      forwardToClient: true,
      code: "PHONE_ALREADY_ATTACHED_ERROR",
      ...errData,
    })
  }
}
