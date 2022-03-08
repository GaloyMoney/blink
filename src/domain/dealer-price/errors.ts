import { DomainError, ErrorLevel } from "@domain/shared"

export class DealerPriceError extends DomainError {}

export class DealerPriceServiceError extends DealerPriceError {}
export class UnknownDealerPriceServiceError extends DealerPriceServiceError {
  level = ErrorLevel.Critical
}
