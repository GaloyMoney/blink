import { CacheKeys } from "@/domain/cache"
import { PriceService } from "@/services/price"
import { LocalCacheService } from "@/services/cache/local-cache"
import { SECS_PER_10_MINS } from "@/config"

export const listCurrencies = async (): Promise<PriceCurrency[] | ApplicationError> => {
  return LocalCacheService().getOrSet({
    key: CacheKeys.PriceCurrencies,
    ttlSecs: SECS_PER_10_MINS,
    getForCaching: () => {
      return PriceService().listCurrencies()
    },
  })
}
