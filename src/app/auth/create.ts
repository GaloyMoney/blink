import { createAccountForBearerToken } from "@app/accounts"
import { getDefaultAccountsConfig } from "@config"
import { AccountLevel } from "@domain/accounts"
import { RateLimitConfig } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { AuthWithBearerTokenService } from "@services/kratos/auth-bearer-token"
import { consumeLimiter } from "@services/rate-limit"

export const createBearer = async (
  ip: IpAddress,
): Promise<SessionToken | ApplicationError> => {
  {
    const limitOk = await checkCreateBearerTokenPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkCreateBearerTokenGlobalLimits()
    if (limitOk instanceof Error) return limitOk
  }

  const authService = AuthWithBearerTokenService()
  const kratosResult = await authService.create()
  if (kratosResult instanceof Error) return kratosResult

  const configDefault = getDefaultAccountsConfig()
  const config = { ...configDefault, initialLevel: AccountLevel.Zero }

  const userId = kratosResult.kratosUserId

  const account = await createAccountForBearerToken({
    config,
    userId,
  })
  if (account instanceof Error) throw account

  return kratosResult.sessionToken
}

const checkCreateBearerTokenPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.createBearerTokenPerIp,
    keyToConsume: ip,
  })

const checkCreateBearerTokenGlobalLimits = async (): Promise<
  true | RateLimiterExceededError
> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.createBearerTokenPerIp,
    keyToConsume: "",
  })
