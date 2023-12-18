import {
  CacheNotAvailableError,
  CacheUndefinedError,
  UnknownCacheServiceError,
} from "@/domain/cache"
import { redisCache } from "@/services/redis"

export const RedisCacheService = (): ICacheService => {
  const set = async <T>({
    key,
    value,
    ttlSecs,
  }: LocalCacheSetArgs<T>): Promise<T | CacheServiceError> => {
    try {
      const res = await redisCache.setCache(key, value, ttlSecs)
      if (res !== "OK") return new CacheNotAvailableError()

      return value
    } catch (err) {
      return new UnknownCacheServiceError(err)
    }
  }

  const get = async <T>({ key }: LocalCacheGetArgs): Promise<T | CacheServiceError> => {
    try {
      const value = await redisCache.getCache(key)
      if (value === undefined) return new CacheUndefinedError()

      return value
    } catch (err) {
      return new UnknownCacheServiceError(err)
    }
  }

  const getOrSet = async <C, F extends () => ReturnType<F>>({
    key,
    ttlSecs,
    getForCaching,
    inflate,
  }: LocalCacheGetOrSetArgs<C, F>): Promise<ReturnType<F>> => {
    if (inflate) {
      const cachedData = await get<C>({ key })
      if (!(cachedData instanceof Error)) return inflate(cachedData)
    } else {
      const cachedData = await get<ReturnType<F>>({ key })
      if (!(cachedData instanceof Error)) return cachedData
    }

    const data = await getForCaching()

    // Typescript can't parse 'ReturnType<F>' to filter out 'Error' types
    if (data instanceof Error) return data
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    set<ReturnType<F>>({ key, value: data, ttlSecs })
    return data
  }

  const clear = async ({
    key,
  }: LocalCacheClearArgs): Promise<true | CacheServiceError> => {
    try {
      await redisCache.deleteCache(key)
      return true
    } catch (err) {
      return new UnknownCacheServiceError(err)
    }
  }

  return { set, get, getOrSet, clear }
}
