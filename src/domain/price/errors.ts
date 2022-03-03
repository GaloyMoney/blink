import { DomainError, ErrorLevel } from "@domain/shared"

export class PriceError extends DomainError {}

export class PriceServiceError extends PriceError {}
export class PriceNotAvailableError extends PriceServiceError {}
export class PriceHistoryNotAvailableError extends PriceServiceError {}
export class UnknownPriceServiceError extends PriceServiceError {
  level = ErrorLevel.Critical
}
