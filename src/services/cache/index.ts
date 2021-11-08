import {
  LocalCacheNotAvailableError,
  LocalCacheUndefinedError,
  UnknownLocalCacheServiceError,
} from "@domain/cache"
import NodeCache from "node-cache"

const localCache = new NodeCache()

export const LocalCacheService = (): ILocalCacheService => {
  const set = <T>(
    key: CacheKeys | string,
    value: T,
    ttlSecs: number,
  ): Promise<T | LocalCacheServiceError> => {
    try {
      const res = localCache.set<T>(key, value, ttlSecs)
      if (res) return Promise.resolve(value)
    } catch (err) {
      return Promise.resolve(new UnknownLocalCacheServiceError(err))
    }
    return Promise.resolve(new LocalCacheNotAvailableError())
  }

  const get = <T>(key: CacheKeys | string): Promise<T | LocalCacheServiceError> => {
    try {
      const value = localCache.get<T>(key)
      if (value !== undefined) return Promise.resolve(value)
    } catch (err) {
      return Promise.resolve(new UnknownLocalCacheServiceError(err))
    }
    return Promise.resolve(new LocalCacheUndefinedError())
  }

  const clear = (key: CacheKeys | string): Promise<true | LocalCacheServiceError> => {
    try {
      localCache.del(key)
      return Promise.resolve(true)
    } catch (err) {
      return Promise.resolve(new UnknownLocalCacheServiceError(err))
    }
  }

  return { set, get, clear }
}
