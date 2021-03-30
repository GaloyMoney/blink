import asyncRedis from "async-redis";
import redis from "redis"

export const redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IP)
let clientAsync 

export const getAsyncRedisClient = () => {
  clientAsync = clientAsync ?? asyncRedis.decorate(redisClient);
  return clientAsync
}
