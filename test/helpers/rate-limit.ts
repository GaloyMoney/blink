import { RateLimitConfig } from "@domain/rate-limit"
import { resetLimiter } from "@services/rate-limit"

export const resetSelfAccountIdLimits = async (
  accountId: AccountId,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.invoiceCreate,
    keyToConsume: accountId,
  })

export const resetRecipientAccountIdLimits = async (
  accountId: AccountId,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.invoiceCreateForRecipient,
    keyToConsume: accountId,
  })

export const resetOnChainAddressAccountIdLimits = async (
  accountId: AccountId,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.onChainAddressCreate,
    keyToConsume: accountId,
  })

export const resetUserPhoneCodeAttemptPhoneMinIntervalLimits = async (
  phone: PhoneNumber,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.requestPhoneCodeAttemptPerPhoneMinInterval,
    keyToConsume: phone,
  })

export const resetUserPhoneCodeAttemptPhone = async (
  phone: PhoneNumber,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.requestPhoneCodeAttemptPerPhone,
    keyToConsume: phone,
  })

export const resetUserPhoneCodeAttemptIp = async (
  ip: IpAddress,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.requestPhoneCodeAttemptPerIp,
    keyToConsume: ip,
  })

export const resetUserLoginPhoneRateLimits = async (
  phone: PhoneNumber,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.failedLoginAttemptPerPhone,
    keyToConsume: phone,
  })

export const resetUserLoginIpRateLimits = async (
  ip: IpAddress,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.failedLoginAttemptPerIp,
    keyToConsume: ip,
  })
