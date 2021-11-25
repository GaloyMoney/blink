import {
  getFailedLoginAttemptPerIpLimits,
  getFailedLoginAttemptPerPhoneLimits,
} from "@config/app"
import { CouldNotFindUserFromPhoneError, UnknownRepositoryError } from "@domain/errors"
import { RateLimitPrefix } from "@domain/rate-limit"
import {
  RateLimiterExceededError,
  UserLoginIpRateLimiterExceededError,
  UserLoginPhoneRateLimiterExceededError,
} from "@domain/rate-limit/errors"
import { createToken } from "@services/jwt"
import { UsersRepository } from "@services/mongoose"
import { PhoneCodesRepository } from "@services/mongoose/phone-code"
import { TwilioClient } from "@services/twilio"
import { RedisRateLimitService } from "@services/rate-limit"
import { isTestAccountPhoneAndCode } from "."

export const login = async ({
  phone,
  code,
  logger,
  ip,
}: {
  phone: PhoneNumber
  code: PhoneCode
  logger: Logger
  ip: IpAddress
}): Promise<JwtToken | ApplicationError> => {
  const subLogger = logger.child({ topic: "login" })

  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkFailedLoginAttemptPerPhoneLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  // TODO:
  // add fibonachi on failed login
  // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#dynamic-block-duration

  const validCode = await isCodeValid({ phone, code })
  if (validCode instanceof Error) return validCode

  await rewardFailedLoginAttemptPerIpLimits(ip)

  const userRepo = UsersRepository()
  let user: RepositoryError | User = await userRepo.findByPhone(phone)

  if (user instanceof CouldNotFindUserFromPhoneError) {
    subLogger.info({ phone }, "new user signup")

    const userRaw = { phone } as NewUserInfo

    const carrierInfo = await TwilioClient().getCarrier(phone)
    if (carrierInfo instanceof Error) {
      // non fatal error
      subLogger.warn({ phone }, "impossible to fetch carrier")
    } else {
      userRaw.twilio = carrierInfo
    }

    user = await userRepo.persistNew(userRaw)
    if (user instanceof Error) return user
  } else if (user instanceof Error) {
    return user
  } else {
    subLogger.info({ phone }, "user login")
  }

  return createToken({ uid: user.id })
}

const checkFailedLoginAttemptPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> => {
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.failedAttemptLoginIp,
    limitOptions: getFailedLoginAttemptPerIpLimits(),
  })
  const limitOk = await limiter.consume(ip)
  if (limitOk instanceof RateLimiterExceededError)
    return new UserLoginIpRateLimiterExceededError()
  return limitOk
}

const rewardFailedLoginAttemptPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> => {
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.failedAttemptLoginIp,
    limitOptions: getFailedLoginAttemptPerIpLimits(),
  })
  const limitOk = await limiter.reward(ip)
  if (limitOk instanceof Error) return new UnknownRepositoryError()
  return limitOk
}

const checkFailedLoginAttemptPerPhoneLimits = async (
  phone: PhoneNumber,
): Promise<true | RateLimiterExceededError> => {
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.failedAttemptLoginPhone,
    limitOptions: getFailedLoginAttemptPerPhoneLimits(),
  })
  const limitOk = await limiter.consume(phone)
  if (limitOk instanceof RateLimiterExceededError)
    return new UserLoginPhoneRateLimiterExceededError()
  return limitOk
}

const isCodeValid = async ({ code, phone }: { phone: PhoneNumber; code: PhoneCode }) => {
  const validTestCode = isTestAccountPhoneAndCode({ code, phone })

  if (!validTestCode) {
    const validCode = await PhoneCodesRepository().findRecent({ code, phone })

    if (validCode instanceof Error) return validCode
  }

  return true
}
