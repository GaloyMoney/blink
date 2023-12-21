import { DomainError, ErrorLevel } from "@/domain/shared"

export class RateLimitError extends DomainError {}

export class RateLimitServiceError extends RateLimitError {}
export class UnknownRateLimitServiceError extends RateLimitServiceError {
  level = ErrorLevel.Critical
}

export class RateLimiterExceededError extends RateLimitServiceError {}
export class UserCodeAttemptIdentifierRateLimiterExceededError extends RateLimiterExceededError {}
export class UserCodeAttemptIpRateLimiterExceededError extends RateLimiterExceededError {}
export class CreateDeviceAccountIpRateLimiterExceededError extends RateLimiterExceededError {}
export class UserLoginIpRateLimiterExceededError extends RateLimiterExceededError {}
export class UserLoginIdentifierRateLimiterExceededError extends RateLimiterExceededError {}
export class InvoiceCreateRateLimiterExceededError extends RateLimiterExceededError {}
export class InvoiceCreateForRecipientRateLimiterExceededError extends RateLimiterExceededError {}
export class OnChainAddressCreateRateLimiterExceededError extends RateLimiterExceededError {}
export class DeviceAccountCreateRateLimiterExceededError extends RateLimiterExceededError {}
export class UserCodeAttemptAppcheckJtiLimiterExceededError extends RateLimiterExceededError {}
export class UserAddQuizAttemptIpRateLimiterExceededError extends RateLimiterExceededError {}
