import {
  BTC_NETWORK,
  getFailedLoginAttemptPerIpLimits,
  getTestAccounts,
  VALIDITY_TIME_CODE,
} from "@config"
import { TestAccountsChecker } from "@domain/accounts/test-accounts-checker"
import { CouldNotFindUserFromPhoneError } from "@domain/errors"
import { RateLimitConfig, RateLimitPrefix } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { checkedToPhoneNumber } from "@domain/users"
import { createToken } from "@services/jwt"
import { UsersRepository } from "@services/mongoose"
import { PhoneCodesRepository } from "@services/mongoose/phone-code"
import { consumeLimiter, RedisRateLimitService } from "@services/rate-limit"

import { createUser } from "."

export const login = async ({
  phone,
  code,
  logger,
  ip,
}: {
  phone: string
  code: PhoneCode
  logger: Logger
  ip: IpAddress
}): Promise<JwtToken | ApplicationError> => {
  const phoneNumberValid = checkedToPhoneNumber(phone)
  if (phoneNumberValid instanceof Error) return phoneNumberValid

  const subLogger = logger.child({ topic: "login" })

  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkFailedLoginAttemptPerPhoneLimits(phoneNumberValid)
    if (limitOk instanceof Error) return limitOk
  }

  // TODO:
  // add fibonachi on failed login
  // https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example#dynamic-block-duration

  const age = VALIDITY_TIME_CODE
  const validCode = await isCodeValid({ phone: phoneNumberValid, code, age })
  if (validCode instanceof Error) return validCode

  await rewardFailedLoginAttemptPerIpLimits(ip)

  const userRepo = UsersRepository()
  let user = await userRepo.findByPhone(phoneNumberValid)

  if (user instanceof CouldNotFindUserFromPhoneError) {
    subLogger.info({ phone }, "new user signup")
    const userRaw: NewUserInfo = { phone: phoneNumberValid, phoneMetadata: null }
    user = await createUser(userRaw)
    if (user instanceof Error) return user
  } else if (user instanceof Error) {
    return user
  } else {
    subLogger.info({ phone }, "user login")
  }

  const network = BTC_NETWORK
  return createToken({ uid: user.id, network })
}

const checkFailedLoginAttemptPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.failedLoginAttemptPerIp,
    keyToConsume: ip,
  })

const rewardFailedLoginAttemptPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> => {
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.failedLoginAttemptPerIp,
    limitOptions: getFailedLoginAttemptPerIpLimits(),
  })
  return limiter.reward(ip)
}

const checkFailedLoginAttemptPerPhoneLimits = async (
  phone: PhoneNumber,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.failedLoginAttemptPerPhone,
    keyToConsume: phone,
  })

const isCodeValid = async ({
  code,
  phone,
  age,
}: {
  phone: PhoneNumber
  code: PhoneCode
  age: Seconds
}) => {
  const testAccounts = getTestAccounts()
  const validTestCode = TestAccountsChecker(testAccounts).isPhoneAndCodeValid({
    code,
    phone,
  })

  if (validTestCode) {
    return true
  } else {
    return PhoneCodesRepository().existNewerThan({ code, phone, age })
  }
}
