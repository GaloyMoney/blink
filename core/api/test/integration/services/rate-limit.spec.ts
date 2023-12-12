import { RateLimitConfig, RateLimitPrefix } from "@/domain/rate-limit"
import { RateLimiterExceededError } from "@/domain/rate-limit/errors"

import { RedisRateLimitService, resetLimiter } from "@/services/rate-limit"

const keyToConsume = "accountId" as AccountId
const rateLimitConfig = RateLimitConfig.invoiceCreate
const keyPrefix = RateLimitPrefix.invoiceCreate

beforeEach(async () => {
  await resetLimiter({
    rateLimitConfig,
    keyToConsume,
  })
})

describe("RedisRateLimitService", () => {
  const rateLimit = RedisRateLimitService({
    keyPrefix,
    limitOptions: rateLimitConfig.limits,
  })

  it("consume", async () => {
    for (let i = 0; i < rateLimitConfig.limits.points; i++) {
      const res = await rateLimit.consume(keyToConsume)
      expect(res).not.toBeInstanceOf(Error)
    }
    const res = await rateLimit.consume(keyToConsume)
    expect(res).toBeInstanceOf(RateLimiterExceededError)
  })
})
