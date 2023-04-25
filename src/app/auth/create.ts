import { createAccountForDeviceAccount } from "@app/accounts"
import { getDefaultAccountsConfig } from "@config"
import { AccountLevel } from "@domain/accounts"
import { RateLimitConfig } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { consumeLimiter } from "@services/rate-limit"

export const createDeviceAccount = async ({
  ip,
  userId,
}: {
  ip: IpAddress
  userId: UserId
}): Promise<"SUCCESS" | ApplicationError> => {
  {
    const limitOk = await checkCreateDeviceAccountPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkCreateDeviceAccountGlobalLimits()
    if (limitOk instanceof Error) return limitOk
  }

  const configDefault = getDefaultAccountsConfig()
  const config = { ...configDefault, initialLevel: AccountLevel.Zero }

  const account = await createAccountForDeviceAccount({
    config,
    userId,
  })
  if (account instanceof Error) throw account

  return "SUCCESS" // TODO: proper type
}

const checkCreateDeviceAccountPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.createDeviceAccountPerIp,
    keyToConsume: ip,
  })

const checkCreateDeviceAccountGlobalLimits = async (): Promise<
  true | RateLimiterExceededError
> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.createDeviceAccountPerIp,
    keyToConsume: "",
  })
