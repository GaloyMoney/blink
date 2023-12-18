import RedisCache from "ioredis-cache"
import { RedisPubSub } from "graphql-redis-subscriptions"

import Redis from "ioredis"

import { baseLogger } from "@/services/logger"
import {
  REDIS_0_DNS,
  REDIS_0_PORT,
  REDIS_1_DNS,
  REDIS_1_PORT,
  REDIS_2_DNS,
  REDIS_2_PORT,
  REDIS_MASTER_NAME,
  REDIS_PASSWORD,
  REDIS_TYPE,
} from "@/config"

let connectionObj = {}

if (REDIS_TYPE === "standalone") {
  connectionObj = {
    name: REDIS_MASTER_NAME,
    host: REDIS_0_DNS,
    port: REDIS_0_PORT,
    password: REDIS_PASSWORD,
  }
} else {
  connectionObj = {
    sentinelPassword: REDIS_PASSWORD,
    sentinels: [
      {
        host: `${REDIS_0_DNS}`,
        port: REDIS_0_PORT,
      },
      {
        host: `${REDIS_1_DNS}`,
        port: REDIS_1_PORT,
      },
      {
        host: `${REDIS_2_DNS}`,
        port: REDIS_2_PORT,
      },
    ],
    name: REDIS_MASTER_NAME,
    password: REDIS_PASSWORD,
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
