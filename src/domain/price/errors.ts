import { DomainError, ErrorLevel } from "@domain/errors"

export class PriceError extends DomainError {}

export class PriceServiceError extends PriceError {}
export class PriceNotAvailableError extends PriceServiceError {}
export class PriceHistoryNotAvailableError extends PriceServiceError {}
export class UnknownPriceServiceError extends PriceServiceError {
  level = ErrorLevel.Critical
}
