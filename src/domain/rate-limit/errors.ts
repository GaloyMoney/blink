import { DomainError, ErrorLevel } from "@domain/shared"

export class RateLimitError extends DomainError {}

export class RateLimitServiceError extends RateLimitError {}
export class UnknownRateLimitServiceError extends RateLimitServiceError {
  level = ErrorLevel.Critical
}

export class RateLimiterExceededError extends RateLimitServiceError {}
export class UserPhoneCodeAttemptPhoneRateLimiterExceededError extends RateLimiterExceededError {}
export class UserPhoneCodeAttemptPhoneMinIntervalRateLimiterExceededError extends RateLimiterExceededError {}
export class UserPhoneCodeAttemptIpRateLimiterExceededError extends RateLimiterExceededError {}
export class UserLoginIpRateLimiterExceededError extends RateLimiterExceededError {}
export class UserLoginPhoneRateLimiterExceededError extends RateLimiterExceededError {}
export class InvoiceCreateRateLimiterExceededError extends RateLimiterExceededError {}
export class InvoiceCreateForRecipientRateLimiterExceededError extends RateLimiterExceededError {}
export class OnChainAddressCreateRateLimiterExceededError extends RateLimiterExceededError {}
