import { RateLimitPrefix } from "@domain/rate-limit"
import { redis } from "@services/redis"

export const clearKeys = async (prefix) => {
  const keys = await redis.keys(`${prefix}:*`)
  for (const key of keys) {
    await redis.del(key)
  }
}

export const clearAccountLocks = () => clearKeys("locks:account")

export const clearLimitersWithExclusions = async (exclusions: string[]) => {
  for (const limiter in RateLimitPrefix) {
    const limiterValue = RateLimitPrefix[limiter]
    if (!exclusions.includes(limiterValue)) {
      await clearKeys(limiterValue)
    }
  }
}

export const clearLimiters = async () => {
  await clearLimitersWithExclusions([])
}
