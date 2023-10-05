import { getCurrencyMajorExponent } from "@/domain/fiat"
import { toDisplayPriceRatio, toWalletPriceRatio } from "@/domain/payments"

export const getCurrentSatPrice = async ({
  currency,
}: GetCurrentSatPriceArgs): Promise<
  RealTimePrice<DisplayCurrency> | ApplicationError
> => {
  const USD = 0.0005

  switch (currency) {
    case "CRC":
      return {
        timestamp: new Date(),
        price: USD * 550,
        currency: currency as DisplayCurrency,
      }
    case "EUR":
      return {
        timestamp: new Date(),
        price: USD * 0.8,
        currency: currency as DisplayCurrency,
      }
    default:
      return {
        timestamp: new Date(),
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
    timestamp: new Date(),
    price: 21,
    currency: currency as DisplayCurrency,
  }
}

export const getCurrentPriceAsWalletPriceRatio = async ({
  currency,
}: GetCurrentSatPriceArgs): Promise<WalletPriceRatio | PriceServiceError> => {
  const price = await getCurrentSatPrice({ currency })
  if (price instanceof Error) return price

  const exponent = getCurrencyMajorExponent(currency)

  return toWalletPriceRatio(price.price * 10 ** exponent)
}

export const getCurrentPriceAsDisplayPriceRatio = async <T extends DisplayCurrency>({
  currency,
}: GetCurrentSatPriceArgs): Promise<DisplayPriceRatio<"BTC", T> | PriceServiceError> => {
  const price = await getCurrentSatPrice({ currency })
  if (price instanceof Error) return price

  const exponent = getCurrencyMajorExponent(currency)

  return toDisplayPriceRatio({
    ratio: price.price * 10 ** exponent,
    displayCurrency: currency as T,
  })
}
