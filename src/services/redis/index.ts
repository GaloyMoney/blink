import Redis from "ioredis"
import { RedisPubSub } from "graphql-redis-subscriptions"
import RedisCache from "ioredis-cache"

import { baseLogger } from "@services/logger"

let connectionObj = {}

if (process.env.LOCAL === "docker-compose") {
  connectionObj = {
    name: process.env.REDIS_MASTER_NAME ?? "mymaster",
    host: process.env.REDIS_0_INTERNAL_IP,
    port: process.env.REDIS_0_PORT,
    password: process.env.REDIS_PASSWORD,
  }
} else {
  connectionObj = {
    sentinelPassword: process.env.REDIS_PASSWORD,
    sentinels: [
      {
        host: `${process.env.REDIS_0_DNS}`,
        port: process.env.REDIS_0_SENTINEL_PORT || 26379,
      },
      {
        host: `${process.env.REDIS_1_DNS}`,
        port: process.env.REDIS_1_SENTINEL_PORT || 26379,
      },
      {
        host: `${process.env.REDIS_2_DNS}`,
        port: process.env.REDIS_2_SENTINEL_PORT || 26379,
      },
    ],
    name: process.env.REDIS_MASTER_NAME ?? "mymaster",
    password: process.env.REDIS_PASSWORD,
  }
}

export const redis = new Redis(connectionObj)
redis.on("error", (err) => baseLogger.error({ err }, "Redis error"))

export const redisSub = new Redis(connectionObj)
redisSub.on("error", (err) => baseLogger.error({ err }, "redisSub error"))

export const redisPubSub = new RedisPubSub({
  publisher: redis,
  subscriber: redisSub,
})

export const redisCacheInstance = new Redis(connectionObj)
redisCacheInstance.on("error", (err) =>
  baseLogger.error({ err }, "redisCacheInstance error"),
)

export const redisCache = new RedisCache(redisCacheInstance)

export const disconnectAll = () => {
  redis.disconnect()
  redisSub.disconnect()
  redisCacheInstance.disconnect()
}

export * from "./routes"
