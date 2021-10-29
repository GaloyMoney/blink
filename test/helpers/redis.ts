import { RateLimitPrefix } from "@domain/rate-limit"
import { redis } from "@services/redis"

export const clearKeys = async (prefix) => {
  const keys = await redis.keys(`${prefix}:*`)
  for (const key of keys) {
    await redis.del(key)
  }
}

export const clearAccountLocks = async () => {
  await clearKeys("locks:account")
}

export const clearLimiters = async () => {
  for (const limiter in RateLimitPrefix) {
    await clearKeys(RateLimitPrefix[limiter])
  }
}
