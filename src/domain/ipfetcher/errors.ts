export class IpFetcherError extends Error {
  name = this.constructor.name
}

export class IpFetcherServiceError extends IpFetcherError {}
export class UnknownIpFetcherServiceError extends IpFetcherError {}
