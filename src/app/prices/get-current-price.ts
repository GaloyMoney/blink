import { CacheKeys } from "@domain/cache"
import { toSeconds } from "@domain/primitives"
import { PriceService } from "@services/price"
import { LocalCacheService } from "@services/cache"
import { PriceNotAvailableError } from "@domain/price"

export const getCurrentPrice = async (): Promise<
  DisplayCurrencyPerSat | ApplicationError
> => {
  const realtimePrice = await PriceService().getRealTimePrice()
  if (realtimePrice instanceof Error) return getCachedPrice()
  // keep price in cache for 10 mins in case the price pod is not online
  await LocalCacheService().set<DisplayCurrencyPerSat>({
    key: CacheKeys.CurrentPrice,
    value: realtimePrice,
    ttlSecs: toSeconds(600),
  })
  return realtimePrice
}

export const newGetCurrentPrice = async (): Promise<
  CentsPerSatsRatio | PriceServiceError
> => {
  const realtimePrice = await PriceService().getRealTimePrice()
  if (realtimePrice instanceof Error) return newGetCachedPrice()
  // keep price in cache for 10 mins in case the price pod is not online
  await LocalCacheService().set<CentsPerSatsRatio>({
    key: CacheKeys.CurrentPrice,
    value: realtimePrice as unknown as CentsPerSatsRatio,
    ttlSecs: toSeconds(600),
  })
  return realtimePrice as unknown as CentsPerSatsRatio
}

const getCachedPrice = async (): Promise<
  DisplayCurrencyPerSat | PriceNotAvailableError
> => {
  const cachedPrice = await LocalCacheService().get<DisplayCurrencyPerSat>(
    CacheKeys.CurrentPrice,
  )
  if (cachedPrice instanceof Error) return new PriceNotAvailableError()
  return cachedPrice
}

const newGetCachedPrice = async (): Promise<CentsPerSatsRatio | PriceServiceError> => {
  const cachedPrice = await LocalCacheService().get<CentsPerSatsRatio>(
    CacheKeys.CurrentPrice,
  )
  if (cachedPrice instanceof Error) return new PriceNotAvailableError()
  return cachedPrice
}
