export class DealerPriceError extends Error {
  name = this.constructor.name
}

export class DealerPriceServiceError extends DealerPriceError {}
export class UnknownDealerPriceServiceError extends DealerPriceServiceError {}
