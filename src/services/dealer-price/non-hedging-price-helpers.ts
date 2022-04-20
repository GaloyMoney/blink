import { CacheKeys } from "@domain/cache"
import { toSeconds } from "@domain/primitives"
import { PriceService } from "@services/price"
import { LocalCacheService } from "@services/cache"
import { PriceNotAvailableError } from "@domain/price"

export const getCurrentPrice = async (): Promise<
  CentsPerSatsRatio | ApplicationError
> => {
  const realtimePrice = await PriceService().getRealTimePrice()
  if (realtimePrice instanceof Error) return getCachedPrice()
  // keep price in cache for 10 mins in case the price pod is not online
  await LocalCacheService().set<DisplayCurrencyPerSat>({
    key: CacheKeys.CurrentPrice,
    value: realtimePrice,
    ttlSecs: toSeconds(600),
  })
  return realtimePrice as unknown as CentsPerSatsRatio
}

const getCachedPrice = async (): Promise<CentsPerSatsRatio | PriceNotAvailableError> => {
  const cachedPrice = await LocalCacheService().get<DisplayCurrencyPerSat>(
    CacheKeys.CurrentPrice,
  )
  if (cachedPrice instanceof Error) return new PriceNotAvailableError()
  return cachedPrice as unknown as CentsPerSatsRatio
}
