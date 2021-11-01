import {
  PriceServiceError,
  PriceNotAvailableError,
  UnknownPriceServiceError,
  PriceHistoryNotAvailableError,
} from "@domain/price"
import { baseLogger } from "../logger"
import { CacheKeys, localCache } from "./local-cache"
import { getPriceHistory } from "./get-price-history"
import { getRealTimePrice } from "./get-realtime-price"

export const PriceService = (): IPriceService => {
  const pair = "BTC/USD"
  const exchange = "bitfinex"

  const getCurrentPrice = async (): Promise<UsdPerSat | PriceServiceError> => {
    try {
      const btcPrice =
        (await getRealTimePrice()) || localCache.get(CacheKeys.CurrentPrice)
      if (btcPrice && btcPrice > 0) {
        // keep price in cache for 10 mins in case the price pod is not online
        localCache.set(CacheKeys.CurrentPrice, btcPrice, 600)
        return (btcPrice / Math.pow(10, 8)) as UsdPerSat
      }
    } catch (err) {
      baseLogger.error({ err }, "impossible to fetch/update cached price")
      return new UnknownPriceServiceError(err)
    }

    return new PriceNotAvailableError()
  }

  const listHistory = async (
    range: PriceRange,
    interval: PriceInterval,
  ): Promise<Tick[] | PriceServiceError> => {
    const cacheKey = CacheKeys.PriceHistory(range, interval)
    try {
      const cache = localCache.get<Tick[]>(cacheKey)
      if (cache && cache.length > 0) return cache

      const history = await getPriceHistory({ pair, exchange, range, interval })
      if (history instanceof Error) return history

      if (history && history.length > 0) {
        // keep price history in cache for 5 mins
        localCache.set(cacheKey, history, 300)
        return history
      }
    } catch (err) {
      baseLogger.error({ err }, "impossible to fetch/update cached price")
      return new UnknownPriceServiceError(err)
    }

    return new PriceHistoryNotAvailableError()
  }

  return {
    getCurrentPrice,
    listHistory,
  }
}
