import { CacheKeys } from "@/domain/cache"
import { toSeconds } from "@/domain/primitives"
import { PriceService } from "@/services/price"
import { PriceHistoryNotAvailableError } from "@/domain/price"
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

  const cachedPriceHistory = await localCache.get<Tick[]>({ key: cacheKey })
  if (!(cachedPriceHistory instanceof Error)) return cachedPriceHistory

  const priceHistory = await PriceService().listHistory({ range, interval })
  if (priceHistory instanceof Error) return priceHistory

  if (priceHistory.length > 0) {
    // keep price history in cache for 5 mins
    await localCache.set<Tick[]>({
      key: cacheKey,
      value: priceHistory,
      ttlSecs: toSeconds(300),
    })
    return priceHistory
  }

  return new PriceHistoryNotAvailableError()
}
