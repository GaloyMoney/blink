import { DomainError, ErrorLevel } from "@domain/shared"

export class DealerPriceError extends DomainError {}

export class DealerPriceServiceError extends DealerPriceError {}
export class DealerPriceNotAvailableError extends DealerPriceServiceError {}
export class NoConnectionToDealerError extends DealerPriceServiceError {}
export class UnknownDealerPriceServiceError extends DealerPriceServiceError {
  level = ErrorLevel.Critical
}
