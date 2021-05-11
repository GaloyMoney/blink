const redis = require('redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
import { yamlConfig } from "./config";

const redisClient = redis.createClient(
  process.env.REDIS_PORT, 
  process.env.REDIS_IP, 
  { enable_offline_queue: false }
);

export const limiterRequestPhoneCode = new RateLimiterRedis({
  redis: redisClient,
  keyPrefix: 'request_phone_code',
  points: yamlConfig.limits.requestPhoneCode.points,
  duration: yamlConfig.limits.requestPhoneCode.duration,
  blockDuration: yamlConfig.limits.requestPhoneCode.blockDuration, 
});
