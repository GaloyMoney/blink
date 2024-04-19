import { SECS_PER_10_MINS } from "@/config"

import { CacheKeys } from "@/domain/cache"
import { PriceHistoryNotAvailableError } from "@/domain/price"

import { PriceService } from "@/services/price"
import { LocalCacheService } from "@/services/cache/local-cache"

export const getPriceHistory = async ({
  range,
  interval,
}: {
  range: PriceRange
  interval: PriceInterval
}): Promise<Tick[] | ApplicationError> => {
  const localCache = LocalCacheService()
  const cacheKey = `${CacheKeys.PriceHistory}:${range}-${interval}`

  const priceHistory = await PriceService().listHistory({ range, interval })
  if (priceHistory instanceof Error) {
    const cachedPriceHistory = await localCache.get<Tick[]>({ key: cacheKey })
    if (!(cachedPriceHistory instanceof Error)) return cachedPriceHistory
    return priceHistory
  }

  if (priceHistory.length > 0) {
    // keep price history in cache for 10 mins
    await localCache.set<Tick[]>({
      key: cacheKey,
      value: priceHistory,
      ttlSecs: SECS_PER_10_MINS,
    })
    return priceHistory
  }

  return new PriceHistoryNotAvailableError()
}
