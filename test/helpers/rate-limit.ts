import { RateLimitConfig } from "@domain/rate-limit"
import { resetLimiter } from "@services/rate-limit"

export const resetSelfWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({ rateLimitConfig: RateLimitConfig.invoiceCreate, keyToConsume: walletId })

export const resetRecipientWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.invoiceCreateForRecipient,
    keyToConsume: walletId,
  })

export const resetOnChainAddressWalletIdLimits = async (
  walletId: WalletId,
): Promise<true | RateLimitServiceError> =>
  resetLimiter({
    rateLimitConfig: RateLimitConfig.onChainAddressCreate,
    keyToConsume: walletId,
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
