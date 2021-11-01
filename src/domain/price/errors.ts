export class PriceError extends Error {
  name = this.constructor.name
}

export class PriceServiceError extends PriceError {}
export class PriceNotAvailableError extends PriceServiceError {}
export class PriceHistoryNotAvailableError extends PriceServiceError {}
export class UnknownPriceServiceError extends PriceServiceError {}
