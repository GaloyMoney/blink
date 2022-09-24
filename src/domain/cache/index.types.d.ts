type CacheServiceError = import("./errors").CacheServiceError

type CacheKeys =
  typeof import("./index").CacheKeys[keyof typeof import("./index").CacheKeys]

type LocalCacheSetArgs<T> = {
  key: CacheKeys | string
  value: NonError<T>
  ttlSecs: Seconds
}

type LocalCacheGetOrSetArgs<C, F extends () => ReturnType<F>> = {
  key: CacheKeys | string
  ttlSecs: Seconds
  getForCaching: F
  inflate?: (arg: C) => ReturnType<F>
}

interface ICacheService {
  set<T>(args: LocalCacheSetArgs<T>): Promise<T | CacheServiceError>
  get<T>(key: CacheKeys | string): Promise<T | CacheServiceError>
  getOrSet<C, F extends () => ReturnType<F>>(
    args: LocalCacheGetOrSetArgs<C, F>,
  ): Promise<ReturnType<F>>
  clear(key: CacheKeys | string): Promise<true | CacheServiceError>
}
