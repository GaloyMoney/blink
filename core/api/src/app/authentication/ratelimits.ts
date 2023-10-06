import {
  getFailedLoginAttemptPerIpLimits,
  getFailedLoginAttemptPerLoginIdentifierLimits,
} from "@/config"

import { RateLimitConfig, RateLimitPrefix } from "@/domain/rate-limit"
import { RateLimiterExceededError } from "@/domain/rate-limit/errors"

import { RedisRateLimitService, consumeLimiter } from "@/services/rate-limit"

export const checkFailedLoginAttemptPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.failedLoginAttemptPerIp,
    keyToConsume: ip,
  })

export const rewardFailedLoginAttemptPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> => {
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.failedLoginAttemptPerIp,
    limitOptions: getFailedLoginAttemptPerIpLimits(),
  })
  return limiter.reward(ip)
}

export const checkFailedLoginAttemptPerLoginIdentifierLimits = async (
  loginIdentifier: LoginIdentifier,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.failedLoginAttemptPerLoginIdentifier,
    keyToConsume: loginIdentifier,
  })

export const rewardFailedLoginAttemptPerLoginIdentifierLimits = async (
  loginIdentifier: LoginIdentifier,
): Promise<true | RateLimiterExceededError> => {
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.failedLoginAttemptPerLoginIdentifier,
    limitOptions: getFailedLoginAttemptPerLoginIdentifierLimits(),
  })

  return limiter.reward(loginIdentifier)
}
