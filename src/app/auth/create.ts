import { createAccountForDeviceAccount } from "@app/accounts"
import { getDefaultAccountsConfig } from "@config"
import { AccountLevel, checkedToDeviceAccountUserId } from "@domain/accounts"
import { RateLimitConfig } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { consumeLimiter } from "@services/rate-limit"

export const createDeviceAccount = async ({
  ip,
  sub,
}: {
  ip: IpAddress
  sub: string
}): Promise<true | ApplicationError> => {
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

  const userId = checkedToDeviceAccountUserId(sub)
  if (userId instanceof Error) return userId

  const account = await createAccountForDeviceAccount({
    config,
    userId,
    device: sub as DeviceId,
  })
  if (account instanceof Error) throw account

  return true
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
