type LocalCacheServiceError = import("./errors").LocalCacheServiceError

type CacheKeys =
  typeof import("./index").CacheKeys[keyof typeof import("./index").CacheKeys]

interface ILocalCacheService {
  set<T>(
    key: CacheKeys | string,
    value: T,
    ttlSecs: number,
  ): Promise<T | LocalCacheServiceError>
  get<T>(key: CacheKeys | string): Promise<T | LocalCacheServiceError>
  clear(key: CacheKeys | string): Promise<true | LocalCacheServiceError>
}
