import { DomainError, ErrorLevel } from "@domain/errors"

export class IpFetcherError extends DomainError {}

export class IpFetcherServiceError extends IpFetcherError {}
export class UnknownIpFetcherServiceError extends IpFetcherError {
  level = ErrorLevel.Critical
}
