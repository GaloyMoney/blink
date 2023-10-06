import { RateLimitPrefix } from "@/domain/rate-limit"
import { redis } from "@/services/redis"

export const clearKeys = async (prefix: string) => {
  const keys = await redis.keys(`${prefix}:*`)
  for (const key of keys) {
    await redis.del(key)
  }
}

export const clearAccountLocks = () => clearKeys("locks:account")

export const clearLimitersWithExclusions = async (exclusions: string[]) => {
  for (const limiter in RateLimitPrefix) {
    /* eslint @typescript-eslint/ban-ts-comment: "off" */
    // @ts-ignore-next-line no-implicit-any error
    const limiterValue = RateLimitPrefix[limiter]
    if (exclusions.includes(limiterValue)) continue
    await clearKeys(limiterValue)
  }
}

export const clearLimiters = () => clearLimitersWithExclusions([])
