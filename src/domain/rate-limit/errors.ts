export class RateLimitError extends Error {
  name = this.constructor.name
}

export class RateLimitServiceError extends RateLimitError {}
export class UnknownRateLimitServiceError extends RateLimitServiceError {}

export class RateLimiterExceededError extends RateLimitServiceError {}
export class InvoiceCreateRateLimiterExceededError extends RateLimiterExceededError {}
export class OnChainAddressCreateRateLimiterExceededError extends RateLimiterExceededError {}
export class UserLoginIpRateLimiterExceededError extends RateLimitError {}
export class UserLoginPhoneRateLimiterExceededError extends RateLimitError {}
