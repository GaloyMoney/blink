import { RateLimiterRedis } from "rate-limiter-flexible"

import {
  getRequestPhoneCodeLimits,
  getRequestPhoneCodeIpLimits,
  getLoginAttemptLimits,
  getFailedAttemptPerIpLimits,
} from "@config/app"

import { redis } from "@services/redis"

const requestPhoneCodeLimits = getRequestPhoneCodeLimits()
export const limiterRequestPhoneCode = new RateLimiterRedis({
  // @ts-expect-error: TODO
  redis,
  keyPrefix: "request_phone_code",
  ...requestPhoneCodeLimits,
})

const requestPhoneCodeIpLimits = getRequestPhoneCodeIpLimits()
export const limiterRequestPhoneCodeIp = new RateLimiterRedis({
  // @ts-expect-error: TODO
  redis,
  keyPrefix: "request_phone_code_ip",
  ...requestPhoneCodeIpLimits,
})

const loginAttemptLimits = getLoginAttemptLimits()
export const limiterLoginAttempt = new RateLimiterRedis({
  // @ts-expect-error: TODO
  redis,
  keyPrefix: "login",
  ...loginAttemptLimits,
})

// TODO:
// add fibonachi on failed login
// https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#dynamic-block-duration

const failedAttemptPerIpLimits = getFailedAttemptPerIpLimits()
export const failedAttemptPerIp = new RateLimiterRedis({
  // @ts-expect-error: TODO
  redis,
  keyPrefix: "failed_attempt_ip",
  ...failedAttemptPerIpLimits,
})
