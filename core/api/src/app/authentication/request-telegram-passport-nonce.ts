import { randomUUID } from "crypto"

import { RateLimitConfig } from "@/domain/rate-limit"
import { checkedToPhoneNumber } from "@/domain/users"
import { RateLimiterExceededError } from "@/domain/rate-limit/errors"

import { RedisCacheService } from "@/services/cache"
import { consumeLimiter } from "@/services/rate-limit"
import { SECS_PER_10_MINS } from "@/config"
import { telegramPassportRequestKey } from "@/domain/authentication"

const redisCache = RedisCacheService()

export const requestTelegramPassportNonce = async ({
  phone,
  ip,
}: {
  phone: string
  ip: IpAddress
}): Promise<TelegramPassportNonce | ApplicationError> => {
  const checkedPhoneNumber = checkedToPhoneNumber(phone)
  if (checkedPhoneNumber instanceof Error) return checkedPhoneNumber

  const ipLimitOk = await checkRequestTelegramPassportNonceAttemptPerIpLimits(ip)
  if (ipLimitOk instanceof Error) return ipLimitOk

  const phoneLimitOk =
    await checkRequestTelegramPassportNonceAttemptPerPhoneNumberLimits(checkedPhoneNumber)
  if (phoneLimitOk instanceof Error) return phoneLimitOk

  const nonce = randomUUID() as TelegramPassportNonce
  const requestKey = telegramPassportRequestKey(nonce)

  const result = await redisCache.set<PhoneNumber>({
    key: requestKey,
    value: checkedPhoneNumber,
    ttlSecs: SECS_PER_10_MINS,
  })
  if (result instanceof Error) return result

  return nonce
}

const checkRequestTelegramPassportNonceAttemptPerPhoneNumberLimits = async (
  phoneNumber: PhoneNumber,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.requestTelegramPassportNonceAttemptPerPhoneNumber,
    keyToConsume: phoneNumber,
  })

const checkRequestTelegramPassportNonceAttemptPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.requestTelegramPassportNonceAttemptPerIp,
    keyToConsume: ip,
  })
