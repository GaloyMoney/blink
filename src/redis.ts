import Redis from "ioredis"

let connectionObj = {}

if(process.env.LOCAL === 'true') {
  const REDIS_0_INTERNAL_IP = `${process.env.REDIS_0_INTERNAL_IP}:6379` 
  const REDIS_1_INTERNAL_IP = `${process.env.REDIS_1_INTERNAL_IP}:6379`
  const REDIS_2_INTERNAL_IP = `${process.env.REDIS_2_INTERNAL_IP}:6379`
  
  const natMap = {
    [REDIS_0_INTERNAL_IP]: { host: process.env.REDIS_NODE, port: process.env.REDIS_0_PORT },
    [REDIS_1_INTERNAL_IP]: { host: process.env.REDIS_NODE, port: process.env.REDIS_1_PORT },
    [REDIS_2_INTERNAL_IP]: { host: process.env.REDIS_NODE, port: process.env.REDIS_2_PORT }
  }
  connectionObj = {
    sentinels: [
      { host: process.env.REDIS_NODE, port: process.env.REDIS_0_SENTINEL_PORT || 26379 },
      { host: process.env.REDIS_NODE, port: process.env.REDIS_1_SENTINEL_PORT || 26379 },
      { host: process.env.REDIS_NODE, port: process.env.REDIS_2_SENTINEL_PORT || 26379 },
    ],
    name: "mymaster",
    natMap,
  }
} else {
  connectionObj = {
    sentinels: [
      { host: `${process.env.REDIS_0_DNS}`, port: process.env.REDIS_0_PORT },
      { host: `${process.env.REDIS_1_DNS}`, port: process.env.REDIS_1_PORT },
      { host: `${process.env.REDIS_2_DNS}`, port: process.env.REDIS_2_PORT },
    ],
    name: "mymaster",
  }
}

export const redis = new Redis(connectionObj);
export const rateLimiterRedis = new Redis({ ...connectionObj, enable_offline_queue: false })
