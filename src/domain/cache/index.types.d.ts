type LocalCacheServiceError = import("./errors").LocalCacheServiceError

type CacheKeys =
  typeof import("./index").CacheKeys[keyof typeof import("./index").CacheKeys]

type LocalCacheSetArgs<T> = {
  key: CacheKeys | string
  value: T
  ttlSecs: Seconds
}

type LocalCacheGetOrSetArgs<F extends () => ReturnType<F>> = {
  key: CacheKeys | string
  fn: F
  ttlSecs: Seconds
}

interface ILocalCacheService {
  set<T>(args: LocalCacheSetArgs<T>): Promise<T | LocalCacheServiceError>
  get<T>(key: CacheKeys | string): Promise<T | LocalCacheServiceError>
  getOrSet<F extends () => ReturnType<F>>(
    args: LocalCacheGetOrSetArgs<F>,
  ): Promise<ReturnType<F>>
  clear(key: CacheKeys | string): Promise<true | LocalCacheServiceError>
}
