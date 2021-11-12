type LocalCacheServiceError = import("./errors").LocalCacheServiceError

type CacheKeys =
  typeof import("./index").CacheKeys[keyof typeof import("./index").CacheKeys]

type LocalCacheSetArgs<T> = {
  key: CacheKeys | string
  value: T
  ttlSecs: Seconds
}

interface ILocalCacheService {
  set<T>(args: LocalCacheSetArgs<T>): Promise<T | LocalCacheServiceError>
  get<T>(key: CacheKeys | string): Promise<T | LocalCacheServiceError>
  clear(key: CacheKeys | string): Promise<true | LocalCacheServiceError>
}
