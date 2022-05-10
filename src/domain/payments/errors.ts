import { ValidationError, ErrorLevel } from "@domain/shared"

export class InvalidBtcPaymentAmountError extends ValidationError {}
export class InvalidUsdPaymentAmountError extends ValidationError {}
export class InvalidZeroAmountPriceRatioInputError extends ValidationError {}
export class LnPaymentRequestNonZeroAmountRequiredError extends ValidationError {}
export class LnPaymentRequestZeroAmountRequiredError extends ValidationError {}

export class NonLnPaymentTransactionForPaymentFlowError extends ValidationError {
  level = ErrorLevel.Critical
}
export class MissingPropsInTransactionForPaymentFlowError extends ValidationError {
  level = ErrorLevel.Critical
}
export class InvalidLightningPaymentFlowBuilderStateError extends ValidationError {
  level = ErrorLevel.Critical
}
