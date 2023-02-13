import { CENTS_PER_USD } from "@domain/fiat"
import { toPriceRatio } from "@domain/payments"

export const getCurrentSatPrice = ({
  currency,
}: GetCurrentSatPriceArgs): Promise<
  RealTimePrice<DisplayCurrency> | ApplicationError
> => {
  return Promise.resolve({
    timestamp: new Date(Date.now()),
    price: 0.0005,
    currency: currency as DisplayCurrency,
  })
}

export const getCurrentUsdCentPrice = ({
  currency,
}: GetCurrentUsdCentPriceArgs): Promise<
  RealTimePrice<DisplayCurrency> | ApplicationError
> => {
  return Promise.resolve({
    timestamp: new Date(Date.now()),
    price: 21,
    currency: currency as DisplayCurrency,
  })
}

export const getCurrentPriceAsPriceRatio = async ({
  currency,
}: GetCurrentSatPriceArgs): Promise<PriceRatio | PriceServiceError> => {
  const price = await getCurrentSatPrice({ currency })
  if (price instanceof Error) return price

  return toPriceRatio(price.price * CENTS_PER_USD)
}
