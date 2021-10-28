import { RateLimiterRedis } from "rate-limiter-flexible"
import { redis } from "@services/redis"

import {
  RateLimiterExceededError,
  UnknownRateLimitServiceError,
} from "@domain/rate-limit/errors"

export const RedisRateLimitService = ({
  keyPrefix,
  limitOptions,
}: {
  keyPrefix: RateLimitPrefix
  limitOptions: RateLimitOptions
}): IRateLimitService => {
  const limiter = new RateLimiterRedis({ storeClient: redis, keyPrefix, ...limitOptions })

  const consume = async (key) => {
    try {
      await limiter.consume(key)
      return true
    } catch (err) {
      return new RateLimiterExceededError()
    }
  }

  const reset = async (key) => {
    try {
      await limiter.delete(key)
      return true
    } catch (err) {
      return new UnknownRateLimitServiceError()
    }
  }

  return { consume, reset }
}
