import { CENTS_PER_USD } from "@domain/fiat"
import { toDisplayPriceRatio, toWalletPriceRatio } from "@domain/payments"

export const getCurrentSatPrice = async ({
  currency,
}: GetCurrentSatPriceArgs): Promise<
  RealTimePrice<DisplayCurrency> | ApplicationError
> => {
  const USD = 0.0005

  switch (currency) {
    case "CRC":
      return {
        timestamp: new Date(Date.now()),
        price: USD * 550,
        currency: currency as DisplayCurrency,
      }
    case "EUR":
      return {
        timestamp: new Date(Date.now()),
        price: USD * 0.8,
        currency: currency as DisplayCurrency,
      }
    default:
      return {
        timestamp: new Date(Date.now()),
        price: USD,
        currency: currency as DisplayCurrency,
      }
  }
}

export const getCurrentUsdCentPrice = async ({
  currency,
}: GetCurrentUsdCentPriceArgs): Promise<
  RealTimePrice<DisplayCurrency> | ApplicationError
> => {
  return {
    timestamp: new Date(Date.now()),
    price: 21,
    currency: currency as DisplayCurrency,
  }
}

export const getCurrentPriceAsWalletPriceRatio = async ({
  currency,
}: GetCurrentSatPriceArgs): Promise<WalletPriceRatio | PriceServiceError> => {
  const price = await getCurrentSatPrice({ currency })
  if (price instanceof Error) return price

  return toWalletPriceRatio(price.price * CENTS_PER_USD)
}

export const getCurrentPriceAsDisplayPriceRatio = async <T extends WalletCurrency>({
  currency,
}: GetCurrentSatPriceArgs): Promise<DisplayPriceRatio<"BTC", T> | PriceServiceError> => {
  const price = await getCurrentSatPrice({ currency })
  if (price instanceof Error) return price

  return toDisplayPriceRatio({
    ratio: price.price * CENTS_PER_USD,
    displayCurrency: currency as T,
  })
}
