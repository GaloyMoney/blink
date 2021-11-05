export class CacheError extends Error {
  name = this.constructor.name
}

export class LocalCacheServiceError extends CacheError {}
export class LocalCacheNotAvailableError extends LocalCacheServiceError {}
export class LocalCacheUndefinedError extends LocalCacheServiceError {}
export class UnknownLocalCacheServiceError extends LocalCacheServiceError {}
