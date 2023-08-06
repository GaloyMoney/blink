import RedisCache from "ioredis-cache"
import { RedisPubSub } from "graphql-redis-subscriptions"
import { baseLogger } from "@services/logger"
import Redis from "ioredis"
import { env } from "@config"

let connectionObj = {}

if (env.REDIS_TYPE === "standalone") {
  connectionObj = {
    name: env.REDIS_MASTER_NAME,
    host: env.REDIS_0_DNS,
    port: env.REDIS_0_PORT,
    password: env.REDIS_PASSWORD,
  }
} else {
  connectionObj = {
    sentinelPassword: env.REDIS_PASSWORD,
    sentinels: [
      {
        host: `${env.REDIS_0_DNS}`,
        port: env.REDIS_0_PORT,
      },
      {
        host: `${env.REDIS_1_DNS}`,
        port: env.REDIS_1_PORT,
      },
      {
        host: `${env.REDIS_2_DNS}`,
        port: env.REDIS_2_PORT,
      },
    ],
    name: env.REDIS_MASTER_NAME,
    password: env.REDIS_PASSWORD,
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
