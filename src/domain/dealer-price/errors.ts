import { DomainError, ErrorLevel } from "@domain/errors"

export class DealerPriceError extends DomainError {}

export class DealerPriceServiceError extends DealerPriceError {}
export class UnknownDealerPriceServiceError extends DealerPriceServiceError {
  level = ErrorLevel.Critical
}
