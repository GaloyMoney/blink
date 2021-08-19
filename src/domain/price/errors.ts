export class PriceError extends Error {
  name = this.constructor.name
}

export class PriceServiceError extends PriceError {}
