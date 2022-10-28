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

type LocalCacheGetArgs = {
  key: CacheKeys | string
}

type LocalCacheClearArgs = {
  key: CacheKeys | string
}

interface ICacheService {
  set<T>(args: LocalCacheSetArgs<T>): Promise<T | CacheServiceError>
  get<T>(args: LocalCacheGetArgs): Promise<T | CacheServiceError>
  getOrSet<C, F extends () => ReturnType<F>>(
    args: LocalCacheGetOrSetArgs<C, F>,
  ): Promise<ReturnType<F>>
  clear(args: LocalCacheClearArgs): Promise<true | CacheServiceError>
}
