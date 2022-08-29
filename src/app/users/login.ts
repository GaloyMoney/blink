import {
  BTC_NETWORK,
  getFailedLoginAttemptPerIpLimits,
  getFailedLoginAttemptPerPhoneLimits,
  getTestAccounts,
  MAX_AGE_TIME_CODE,
} from "@config"
import { TestAccountsChecker } from "@domain/accounts/test-accounts-checker"
import {
  CouldNotFindUserFromKratosIdError,
  CouldNotFindUserFromPhoneError,
} from "@domain/errors"
import { RateLimitConfig, RateLimitPrefix } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { checkedToEmailAddress, checkedToKratosUserId } from "@domain/users"
import { createToken } from "@services/jwt"
import { AccountsRepository, UsersRepository } from "@services/mongoose"
import { PhoneCodesRepository } from "@services/mongoose/phone-code"
import { consumeLimiter, RedisRateLimitService } from "@services/rate-limit"

import { createKratosUser, createUser } from "./create-user"

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

  const age = MAX_AGE_TIME_CODE
  const validCode = await isCodeValid({ phone, code, age })
  if (validCode instanceof Error) return validCode

  await rewardFailedLoginAttemptPerIpLimits(ip)
  await rewardFailedLoginAttemptPerPhoneLimits(phone)

  const userRepo = UsersRepository()
  let user = await userRepo.findByPhone(phone)

  if (user instanceof CouldNotFindUserFromPhoneError) {
    subLogger.info({ phone }, "new user signup")
    const userRaw: NewUserInfo = { phone }
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

export const loginWithKratos = async ({
  kratosUserId,
  emailAddress,
  logger,
  ip,
}: {
  kratosUserId: string
  emailAddress: string
  logger: Logger
  ip: IpAddress
}): Promise<{ accountStatus: string; authToken: JwtToken } | ApplicationError> => {
  const kratosUserIdValid = checkedToKratosUserId(kratosUserId)
  if (kratosUserIdValid instanceof Error) return kratosUserIdValid

  const emailAddressValid = checkedToEmailAddress(emailAddress)
  if (emailAddressValid instanceof Error) return emailAddressValid

  const subLogger = logger.child({ topic: "login" })

  {
    const limitOk = await checkFailedLoginAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkfailedLoginAttemptPerEmailAddressLimits(emailAddressValid)
    if (limitOk instanceof Error) return limitOk
  }

  const userRepo = UsersRepository()
  let user = await userRepo.findByKratosUserId(kratosUserIdValid)

  if (user instanceof CouldNotFindUserFromKratosIdError) {
    subLogger.info({ kratosUserId }, "New Kratos user signup")
    user = await createKratosUser({ kratosUserId })
    if (user instanceof Error) return user
  } else if (user instanceof Error) {
    return user
  } else {
    subLogger.info({ kratosUserId }, "Kratos user login")
  }

  const network = BTC_NETWORK

  const account = await AccountsRepository().findByUserId(user.id)
  if (account instanceof Error) return account

  return {
    accountStatus: account.status.toUpperCase(),
    authToken: createToken({
      uid: user.id,
      network,
    }),
  }
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

const rewardFailedLoginAttemptPerPhoneLimits = async (
  phone: PhoneNumber,
): Promise<true | RateLimiterExceededError> => {
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.failedLoginAttemptPerPhone,
    limitOptions: getFailedLoginAttemptPerPhoneLimits(),
  })

  return limiter.reward(phone)
}

const checkfailedLoginAttemptPerEmailAddressLimits = async (
  emailAddress: EmailAddress,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.failedLoginAttemptPerEmailAddress,
    keyToConsume: emailAddress,
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
