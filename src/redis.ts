import Redis from "ioredis"

// export const redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_IP)
// let clientAsync 

export const redis = new Redis({
  sentinels: [
    { host: process.env.REDIS_NODE, port: process.env.REDIS_PORT || 26379 },
  ],
  name: "mymaster",
  natMap: {
    "172.17.0.12:26379": { host: process.env.REDIS_NODE, port: 26379 },
    "172.17.0.13:26379": { host: process.env.REDIS_NODE, port: 26379 },
    "172.17.0.14:26379": { host: process.env.REDIS_NODE, port: 26379 }
  }
});
