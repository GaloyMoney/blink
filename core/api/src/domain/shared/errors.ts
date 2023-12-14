import { parseErrorMessageFromUnknown } from "./error-parsers"

export const ErrorLevel = {
  Info: "info",
  Warn: "warn",
  Critical: "critical",
} as const

export const RankedErrorLevel = [ErrorLevel.Info, ErrorLevel.Warn, ErrorLevel.Critical]

export class DomainError extends Error {
  name: string
  level?: ErrorLevel
  constructor(message?: string | unknown | Error) {
    super(parseErrorMessageFromUnknown(message))
    this.name = this.constructor.name
    this.level = ErrorLevel.Info
  }
}

export class ValidationError extends DomainError {}
export class UnknownDomainError extends DomainError {
  level = ErrorLevel.Critical
}

export class SafeWrapperError extends DomainError {
  level = ErrorLevel.Critical
}
export class BigIntConversionError extends SafeWrapperError {}
export class BigIntFloatConversionError extends BigIntConversionError {}
export class UnknownBigIntConversionError extends BigIntConversionError {
  level = ErrorLevel.Critical
}

export class BtcAmountTooLargeError extends ValidationError {}
export class UsdAmountTooLargeError extends ValidationError {}
export class InvalidBtcPaymentAmountError extends ValidationError {}
export class InvalidUsdPaymentAmountError extends ValidationError {}
