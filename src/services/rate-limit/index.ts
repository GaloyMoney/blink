import {
  RateLimiterExceededError,
  UnknownRateLimitServiceError,
} from "@domain/rate-limit/errors"
import { redis } from "@services/redis"
import { RateLimiterRedis } from "rate-limiter-flexible"

export const RedisRateLimitService = ({
  keyPrefix,
  limitOptions,
}: {
  keyPrefix: RateLimitPrefix
  limitOptions: RateLimitOptions
}): IRateLimitService => {
  const limiter = new RateLimiterRedis({ storeClient: redis, keyPrefix, ...limitOptions })

  const consume = async (key: string) => {
    try {
      await limiter.consume(key)
      return true
    } catch (err) {
      return new RateLimiterExceededError()
    }
  }

  const reset = async (key: string) => {
    try {
      await limiter.delete(key)
      return true
    } catch (err) {
      return new UnknownRateLimitServiceError(err)
    }
  }

  const reward = async (key: string) => {
    try {
      await limiter.reward(key)
      return true
    } catch (err) {
      return new UnknownRateLimitServiceError(err)
    }
  }

  return { consume, reset, reward }
}

export const consumeLimiter = async ({
  rateLimitConfig,
  keyToConsume,
}: {
  rateLimitConfig: RateLimitConfig
  keyToConsume: IpAddress | PhoneNumber | EmailAddress | AccountId
}) => {
  const limiter = RedisRateLimitService({
    keyPrefix: rateLimitConfig.key,
    limitOptions: rateLimitConfig.limits,
  })
  const consume = await limiter.consume(keyToConsume)
  return consume instanceof Error ? new rateLimitConfig.error() : consume
}

export const resetLimiter = async ({
  rateLimitConfig,
  keyToConsume,
}: {
  rateLimitConfig: RateLimitConfig
  keyToConsume: IpAddress | PhoneNumber | AccountId
}) => {
  const limiter = RedisRateLimitService({
    keyPrefix: rateLimitConfig.key,
    limitOptions: rateLimitConfig.limits,
  })
  return limiter.reset(keyToConsume)
}
