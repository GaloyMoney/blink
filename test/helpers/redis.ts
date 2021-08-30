import { redis } from "@services/redis"

export const clearKeys = async (prefix) => {
  const keys = await redis.keys(`${prefix}:*`)
  for (const key of keys) {
    await redis.del(key)
  }
}

export const clearAccountLocks = async () => {
  await clearKeys("locks:account")
}

export const clearLimiters = async () => {
  await clearKeys("login")
  await clearKeys("failed_attempt_ip")
  await clearKeys("request_phone_code")
  await clearKeys("request_phone_code_ip")
}
