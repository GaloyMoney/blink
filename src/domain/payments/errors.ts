import { ValidationError, ErrorLevel } from "@domain/shared"
import { CouldNotFindError } from "@domain/errors"

export class InvalidBtcPaymentAmountError extends ValidationError {}
export class InvalidUsdPaymentAmountError extends ValidationError {}
export class InvalidZeroAmountPriceRatioInputError extends ValidationError {}
export class LnPaymentRequestNonZeroAmountRequiredError extends ValidationError {}
export class LnPaymentRequestZeroAmountRequiredError extends ValidationError {}

export class CouldNotFindLightningPaymentFlowError extends CouldNotFindError {}
export class InvalidLightningPaymentFlowBuilderStateError extends ValidationError {
  level = ErrorLevel.Critical
}
