import {
  LocalCacheNotAvailableError,
  LocalCacheUndefinedError,
  UnknownLocalCacheServiceError,
} from "@domain/cache"
import NodeCache from "node-cache"

const localCache = new NodeCache()

export const LocalCacheService = (): ILocalCacheService => {
  const set = <T>({
    key,
    value,
    ttlSecs,
  }: LocalCacheSetArgs<T>): Promise<T | LocalCacheServiceError> => {
    try {
      const res = localCache.set<T>(key, value, ttlSecs)
      if (res) return Promise.resolve(value)
      return Promise.resolve(new LocalCacheNotAvailableError())
    } catch (err) {
      return Promise.resolve(new UnknownLocalCacheServiceError(err))
    }
  }

  const get = <T>(key: CacheKeys | string): Promise<T | LocalCacheServiceError> => {
    try {
      const value = localCache.get<T>(key)
      if (value === undefined) return Promise.resolve(new LocalCacheUndefinedError())
      return Promise.resolve(value)
    } catch (err) {
      return Promise.resolve(new UnknownLocalCacheServiceError(err))
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

  const clear = (key: CacheKeys | string): Promise<true | LocalCacheServiceError> => {
    try {
      localCache.del(key)
      return Promise.resolve(true)
    } catch (err) {
      return Promise.resolve(new UnknownLocalCacheServiceError(err))
    }
  }

  return { set, get, getOrSet, clear }
}
