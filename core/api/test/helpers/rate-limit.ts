import { RateLimitConfig } from "@/domain/rate-limit"
import { resetLimiter } from "@/services/rate-limit"

export const resetSelfAccountUuidLimits = async (
  accountUuid: AccountUuid,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.invoiceCreate,
    keyToConsume: accountUuid,
  })

export const resetRecipientAccountUuidLimits = async (
  accountUuid: AccountUuid,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.invoiceCreateForRecipient,
    keyToConsume: accountUuid,
  })

export const resetOnChainAddressAccountUuidLimits = async (
  accountUuid: AccountUuid,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.onChainAddressCreate,
    keyToConsume: accountUuid,
  })

export const resetUserPhoneCodeAttemptPhone = async (
  phone: PhoneNumber,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.requestCodeAttemptPerLoginIdentifier,
    keyToConsume: phone,
  })

export const resetUserPhoneCodeAttemptIp = async (
  ip: IpAddress,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.requestCodeAttemptPerIp,
    keyToConsume: ip,
  })

export const resetUserLoginPhoneRateLimits = async (
  phone: PhoneNumber,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.failedLoginAttemptPerLoginIdentifier,
    keyToConsume: phone,
  })

export const resetUserLoginIpRateLimits = async (
  ip: IpAddress,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.failedLoginAttemptPerIp,
    keyToConsume: ip,
  })
