import { RateLimiterRedis } from "rate-limiter-flexible"

import { getRequestPhoneCodeLimits, getRequestPhoneCodeIpLimits } from "@config/app"

import { redis } from "@services/redis"

const requestPhoneCodeLimits = getRequestPhoneCodeLimits()
export const limiterRequestPhoneCode = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "request_phone_code",
  ...requestPhoneCodeLimits,
})

const requestPhoneCodeIpLimits = getRequestPhoneCodeIpLimits()
export const limiterRequestPhoneCodeIp = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "request_phone_code_ip",
  ...requestPhoneCodeIpLimits,
})
