export const ErrorLevel = {
  Info: "info",
  Warn: "warn",
  Critical: "critical",
} as const

export const RankedErrorLevel = [ErrorLevel.Info, ErrorLevel.Warn, ErrorLevel.Critical]

export class DomainError extends Error {
  name: string
  level?: ErrorLevel
  constructor(message?: string) {
    super(message)
    this.name = this.constructor.name
    this.level = ErrorLevel.Info
  }
}

export class ValidationError extends DomainError {}

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
