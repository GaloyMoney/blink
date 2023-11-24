import NodeCache from "node-cache"

import {
  CacheNotAvailableError,
  CacheUndefinedError,
  UnknownCacheServiceError,
} from "@/domain/cache"

const localCache = new NodeCache()

export const LocalCacheService = (): ICacheService => {
  const set = <T>({
    key,
    value,
    ttlSecs,
  }: LocalCacheSetArgs<T>): Promise<T | CacheServiceError> => {
    try {
      const res = localCache.set<T>(key, value, ttlSecs)
      if (res) return Promise.resolve(value)
      return Promise.resolve(new CacheNotAvailableError())
    } catch (err) {
      return Promise.resolve(new UnknownCacheServiceError(err))
    }
  }

  const get = <T>({ key }: LocalCacheGetArgs): Promise<T | CacheServiceError> => {
    try {
      const value = localCache.get<T>(key)
      if (value === undefined) return Promise.resolve(new CacheUndefinedError())
      return Promise.resolve(value)
    } catch (err) {
      return Promise.resolve(new UnknownCacheServiceError(err))
    }
  }

  const getOrSet = async <C, F extends () => ReturnType<F>>({
    key,
    getForCaching,
    ttlSecs,
  }: LocalCacheGetOrSetArgs<C, F>): Promise<ReturnType<F>> => {
    const cachedData = await get<ReturnType<F>>({ key })
    if (!(cachedData instanceof Error)) return cachedData

    const data = await getForCaching()

    // Typescript can't parse 'ReturnType<F>' to filter out 'Error' types
    if (data instanceof Error) return data
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    set<ReturnType<F>>({ key, value: data, ttlSecs })
    return data
  }

  const clear = ({ key }: LocalCacheClearArgs): Promise<true | CacheServiceError> => {
    try {
      localCache.del(key)
      return Promise.resolve(true)
    } catch (err) {
      return Promise.resolve(new UnknownCacheServiceError(err))
    }
  }

  return { set, get, getOrSet, clear }
}
