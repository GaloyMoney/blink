import asyncRedis from "async-redis";
import redis from "redis"
import Redis from 'ioredis'

export const ioredis = new Redis({
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_IP
})

export const redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IP)
let clientAsync 

export const getAsyncRedisClient = () => {
  clientAsync = clientAsync ?? asyncRedis.decorate(redisClient);
  return clientAsync
}
