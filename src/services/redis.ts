import Redis from "ioredis"

import { baseLogger } from "@services/logger"

let connectionObj = {},
  natMap = {}

if (process.env.LOCAL === "docker-compose") {
  connectionObj = {
    name: process.env.REDIS_MASTER_NAME ?? "mymaster",
    host: process.env.REDIS_0_INTERNAL_IP,
    port: process.env.REDIS_0_PORT,
    password: process.env.REDIS_PASSWORD,
  }
} else {
  if (process.env.LOCAL === "true") {
    const REDIS_0_INTERNAL_IP = `${process.env.REDIS_0_INTERNAL_IP}:6379`

    natMap = {
      [REDIS_0_INTERNAL_IP]: {
        host: process.env.REDIS_0_DNS,
        port: process.env.REDIS_0_PORT,
      },
    }
  }

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
    natMap,
  }
}

export const redis = new Redis(connectionObj)
redis.on("error", (err) => baseLogger.error({ err }, "Redis error"))
