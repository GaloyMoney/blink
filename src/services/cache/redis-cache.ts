import {
  CacheNotAvailableError,
  CacheUndefinedError,
  UnknownCacheServiceError,
} from "@domain/cache"
import { redisCache } from "@services/redis"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

export const RedisCacheService = (): ICacheService => {
  const set = async <T>({
    key,
    value,
    ttlSecs,
  }: LocalCacheSetArgs<T>): Promise<T | CacheServiceError> => {
    try {
      const res = await redisCache.setCache(key, value, ttlSecs)
      if (!res) return new CacheNotAvailableError()

      return res
    } catch (err) {
      return new UnknownCacheServiceError(err.message || err)
    }
  }

  const get = async <T>(key: CacheKeys | string): Promise<T | CacheServiceError> => {
    try {
      const value = await redisCache.getCache(key)
      if (value === undefined) return new CacheUndefinedError()

      return value
    } catch (err) {
      return new UnknownCacheServiceError(err.message || err)
    }
  }

  const getOrSet = async <F extends () => ReturnType<F>>({
    key,
    fn,
    ttlSecs,
  }: LocalCacheGetOrSetArgs<F>): Promise<ReturnType<F>> => {
    const cachedData = await get<ReturnType<F>>(key)
    if (!(cachedData instanceof Error)) return cachedData

    const data = await fn()
    set<ReturnType<F>>({ key, value: data, ttlSecs })
    return data
  }

  const clear = async (key: CacheKeys | string): Promise<true | CacheServiceError> => {
    try {
      await redisCache.deleteCache(key)
      return true
    } catch (err) {
      return new UnknownCacheServiceError(err.message || err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.cache.redis",
    fns: { set, get, getOrSet, clear },
  })
}
