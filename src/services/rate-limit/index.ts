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
