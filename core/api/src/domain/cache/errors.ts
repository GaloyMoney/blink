import { DomainError, ErrorLevel } from "@/domain/shared"

export class CacheError extends DomainError {}

export class CacheServiceError extends CacheError {}
export class CacheNotAvailableError extends CacheServiceError {}
export class CacheUndefinedError extends CacheServiceError {}
export class UnknownCacheServiceError extends CacheServiceError {
  level = ErrorLevel.Critical
}
