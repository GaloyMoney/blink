import { ValidationError } from "@domain/shared"
import { CouldNotFindError } from "@domain/errors"

export class InvalidBtcPaymentAmountError extends ValidationError {}
export class InvalidUsdPaymentAmountError extends ValidationError {}
export class LnPaymentRequestNonZeroAmountRequiredError extends ValidationError {}
export class LnPaymentRequestZeroAmountRequiredError extends ValidationError {}

export class CouldNotFindLightningPaymentFlowError extends CouldNotFindError {}
