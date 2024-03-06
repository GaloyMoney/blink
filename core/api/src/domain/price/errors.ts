import { DomainError, ErrorLevel, ValidationError } from "@/domain/shared"

export class PriceError extends DomainError {}

export class InvalidPriceCurrencyError extends ValidationError {}

export class PriceServiceError extends PriceError {}
export class PriceNotAvailableError extends PriceServiceError {}
export class PriceCurrenciesNotAvailableError extends PriceServiceError {}
export class PriceHistoryNotAvailableError extends PriceServiceError {}
export class NoConnectionToPriceServiceError extends PriceServiceError {
  level = ErrorLevel.Critical
}
export class UnknownPriceServiceError extends PriceServiceError {
  level = ErrorLevel.Critical
}
