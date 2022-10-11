import crypto from "crypto"

import Redis from "ioredis"

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
    if (exclusions.includes(limiterValue)) continue
    await clearKeys(limiterValue)
  }
}

export const clearLimiters = () => clearLimitersWithExclusions([])

let ioRedis
let pricePublishInterval

const executePublish = async (ioRedis) => {
  const timestamp = Math.floor(new Date().getTime() / 1000)
  const message = {
    meta: {
      publishedAt: timestamp,
      correlationId: crypto.randomUUID(),
    },
    payloadType: "OkexBtcUsdSwapPricePayload",
    payload: {
      timestamp,
      exchange: "okex",
      instrumentId: "BTC-USD-SWAP",
      askPrice: {
        numeratorUnit: "USD_CENT",
        denominatorUnit: "SATOSHI",
        offset: 12,
        base: "20000000000",
      },
      bidPrice: {
        numeratorUnit: "USD_CENT",
        denominatorUnit: "SATOSHI",
        offset: 12,
        base: "20000000000",
      },
    },
  }
  const channel = "galoy.stablesats.price.okex.btc-usd-swap"
  await ioRedis.publish(channel, JSON.stringify(message))
}

export const publishOkexPrice = async () => {
  ioRedis = new Redis(6379, process.env.REDIS_0_INTERNAL_IP || "localhost")
  await executePublish(ioRedis)
  pricePublishInterval = setInterval(() => executePublish(ioRedis), 1000)
}

export const cancelOkexPricePublish = () => {
  clearInterval(pricePublishInterval)
  ioRedis.quit()
}
