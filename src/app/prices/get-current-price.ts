import { CacheKeys } from "@domain/cache"
import { toSeconds } from "@domain/primitives"
import { PriceService } from "@services/price"
import { LocalCacheService } from "@services/cache"
import { PriceNotAvailableError } from "@domain/price"

export const getCurrentPrice = async ({
  currency = "USD",
}: GetCurrentPriceArgs): Promise<DisplayCurrencyPerSat | ApplicationError> => {
  const realtimePrice = await PriceService().getRealTimePrice({ currency })
  if (realtimePrice instanceof Error) return getCachedPrice({ currency })

  let cachedPrices = await getCachedPrices()
  cachedPrices = cachedPrices instanceof Error ? {} : cachedPrices

  cachedPrices[currency] = realtimePrice

  // keep price in cache for 10 mins in case the price pod is not online
  await LocalCacheService().set<CurrencyPrices>({
    key: CacheKeys.CurrentPrice,
    value: cachedPrices,
    ttlSecs: toSeconds(600),
  })
  return realtimePrice
}

const getCachedPrice = async ({
  currency,
}: GetCachedPriceArgs): Promise<DisplayCurrencyPerSat | PriceNotAvailableError> => {
  const cachedPrices = await getCachedPrices()
  if (cachedPrices instanceof Error) return new PriceNotAvailableError()
  return cachedPrices[currency]
}

const getCachedPrices = async (): Promise<CurrencyPrices | PriceNotAvailableError> => {
  const cachedPrices = await LocalCacheService().get<CurrencyPrices>({
    key: CacheKeys.CurrentPrice,
  })
  if (cachedPrices instanceof Error) return new PriceNotAvailableError()
  return cachedPrices
}
