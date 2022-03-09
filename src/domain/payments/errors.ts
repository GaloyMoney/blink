import { ValidationError } from "@domain/shared"

export class InvalidBtcPaymentAmountError extends ValidationError {}
export class InvalidUsdPaymentAmountError extends ValidationError {}
export class LnPaymentRequestNonZeroAmountRequiredError extends ValidationError {}
export class LnPaymentRequestZeroAmountRequiredError extends ValidationError {}
