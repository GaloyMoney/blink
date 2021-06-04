import { once } from "events"
import Redis from "ioredis"
import { baseLogger } from "./logger"

let connectionObj = {}, natMap = {}

if(process.env.LOCAL === 'true') {
  const REDIS_0_INTERNAL_IP = `${process.env.REDIS_0_INTERNAL_IP}:6379`
  
  natMap = {
    [REDIS_0_INTERNAL_IP]: { host: process.env.REDIS_0_DNS, port: process.env.REDIS_0_PORT }
  }

}

connectionObj = {
  sentinels: [
    { host: `${process.env.REDIS_0_DNS}`, port: process.env.REDIS_0_SENTINEL_PORT || 26379 },
    { host: `${process.env.REDIS_1_DNS}`, port: process.env.REDIS_1_SENTINEL_PORT || 26379 },
    { host: `${process.env.REDIS_2_DNS}`, port: process.env.REDIS_2_SENTINEL_PORT || 26379 },
  ],
  name: process.env.REDIS_MASTER_NAME ?? "mymaster",
  natMap
}

export const redis = new Redis(connectionObj);
redis.on('error', (err) => baseLogger.error({ err }, "Redis error"))

export const rateLimiterRedis = (async () => {
  const redis = new Redis({ ...connectionObj, enableOfflineQueue: false, enableReadyCheck: true })
  await once(redis, 'ready')
  redis.on('error', (err) => baseLogger.error({ err }, "Rate limiter redis error"))
  return redis
})()