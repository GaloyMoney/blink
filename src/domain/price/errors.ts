export class PriceError extends Error {
  name = this.constructor.name
}

export class PriceServiceError extends PriceError {}
export class UnknownPriceServiceError extends PriceServiceError {}
