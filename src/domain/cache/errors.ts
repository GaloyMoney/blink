import { DomainError, ErrorLevel } from "@domain/shared"

export class CacheError extends DomainError {}

export class LocalCacheServiceError extends CacheError {}
export class LocalCacheNotAvailableError extends LocalCacheServiceError {}
export class LocalCacheUndefinedError extends LocalCacheServiceError {}
export class UnknownLocalCacheServiceError extends LocalCacheServiceError {
  level = ErrorLevel.Critical
}
