import { SECS_PER_10_MINS } from "@config"

import { CacheKeys } from "@domain/cache"
import { PriceNotAvailableError } from "@domain/price"
import { checkedToDisplayCurrency } from "@domain/fiat"

import { PriceService } from "@services/price"
import { LocalCacheService } from "@services/cache"

export const getCurrentPrice = async ({
  currency,
}: GetCurrentPriceArgs): Promise<DisplayCurrencyPerSat | ApplicationError> => {
  const checkedDisplayCurrency = checkedToDisplayCurrency(currency)
  if (checkedDisplayCurrency instanceof Error) return checkedDisplayCurrency

  const realtimePrice = await PriceService().getRealTimePrice({
    currency: checkedDisplayCurrency,
  })
  if (realtimePrice instanceof Error)
    return getCachedPrice({ currency: checkedDisplayCurrency })

  let cachedPrices = await getCachedPrices()
  cachedPrices = cachedPrices instanceof Error ? {} : cachedPrices

  cachedPrices[currency] = realtimePrice

  // keep prices in cache for 10 mins in case the price pod is not online
  await LocalCacheService().set<DisplayCurrencyPrices>({
    key: CacheKeys.CurrentPrice,
    value: cachedPrices,
    ttlSecs: SECS_PER_10_MINS,
  })
  return realtimePrice
}

const getCachedPrice = async ({
  currency,
}: GetCachedPriceArgs): Promise<DisplayCurrencyPerSat | PriceNotAvailableError> => {
  const cachedPrices = await getCachedPrices()
  if (cachedPrices instanceof Error || !cachedPrices[currency])
    return new PriceNotAvailableError()
  return cachedPrices[currency]
}

const getCachedPrices = async (): Promise<
  DisplayCurrencyPrices | PriceNotAvailableError
> => {
  const cachedPrices = await LocalCacheService().get<DisplayCurrencyPrices>({
    key: CacheKeys.CurrentPrice,
  })
  if (cachedPrices instanceof Error) return new PriceNotAvailableError()
  return cachedPrices
}
