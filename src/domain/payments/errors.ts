import { DomainError, ValidationError } from "@domain/shared"

export class PaymentError extends DomainError {}

export class InvalidBtcPaymentAmountError extends ValidationError {}
export class InvalidUsdPaymentAmountError extends ValidationError {}
export class LnPaymentRequestNonZeroAmountRequiredError extends ValidationError {}
export class LnPaymentRequestZeroAmountRequiredError extends ValidationError {}

export class PaymentBuilderNotCompleteError extends PaymentError {}
