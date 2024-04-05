import { DomainError, ErrorLevel } from "@/domain/shared"

export class DealerPriceError extends DomainError {}

export class DealerPriceServiceError extends DealerPriceError {}
export class DealerPriceNotAvailableError extends DealerPriceServiceError {}
export class NoConnectionToDealerError extends DealerPriceServiceError {
  level = ErrorLevel.Critical
}
export class DealerStalePriceError extends DealerPriceServiceError {
  level = ErrorLevel.Critical
}
export class NoDealerPriceDataAvailableError extends DealerPriceServiceError {
  level = ErrorLevel.Critical
}
export class UnknownDealerPriceServiceError extends DealerPriceServiceError {
  level = ErrorLevel.Critical
}
