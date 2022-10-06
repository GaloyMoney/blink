import {
  BTC_NETWORK,
  getFailedLoginAttemptPerIpLimits,
  getFailedLoginAttemptPerPhoneLimits,
  getTestAccounts,
  getDefaultAccountsConfig,
  MAX_AGE_TIME_CODE,
} from "@config"

import {
  CouldNotFindAccountFromKratosIdError,
  CouldNotFindUserFromPhoneError,
} from "@domain/errors"
import { checkedToEmailAddress } from "@domain/users"
import { checkedToKratosUserId } from "@domain/accounts"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { RateLimitConfig, RateLimitPrefix } from "@domain/rate-limit"
import { TestAccountsChecker } from "@domain/accounts/test-accounts-checker"

import { createToken } from "@services/jwt"
import { addAttributesToCurrentSpan } from "@services/tracing"
import { PhoneCodesRepository } from "@services/mongoose/phone-code"
import { AccountsRepository, UsersRepository } from "@services/mongoose"
import { consumeLimiter, RedisRateLimitService } from "@services/rate-limit"

import {
  createAccountForEmailSchema,
  createAccountForPhoneSchema,
} from "../accounts/create-account"

const network = BTC_NETWORK

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

  const user = await UsersRepository().findByPhone(phone)
  let account: Account

  if (user instanceof CouldNotFindUserFromPhoneError) {
    subLogger.info({ phone }, "new user signup")
    addAttributesToCurrentSpan({ "login.newAccount": true })
    const userRaw: NewUserInfo = { phone }
    const account_ = await createAccountForPhoneSchema({
      newUserInfo: userRaw,
      config: getDefaultAccountsConfig(),
    })
    if (account_ instanceof Error) return account_
    account = account_
  } else if (user instanceof Error) {
    return user
  } else {
    subLogger.info({ phone }, "user login")

    const account_ = await AccountsRepository().findByUserId(user.id)
    if (account_ instanceof Error) return account_
    account = account_
  }

  return createToken({ uid: account.id, network })
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

  let account = await AccountsRepository().findByKratosUserId(kratosUserIdValid)

  if (account instanceof CouldNotFindAccountFromKratosIdError) {
    subLogger.info({ kratosUserId }, "New Kratos user signup")
    addAttributesToCurrentSpan({ "login.newAccount": true })
    account = await createAccountForEmailSchema({
      kratosUserId,
      config: getDefaultAccountsConfig(),
    })
  }
  if (account instanceof Error) return account

  return {
    accountStatus: account.status.toUpperCase(),
    authToken: createToken({
      uid: account.id,
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
  if (validTestCode) return true

  return PhoneCodesRepository().existNewerThan({ code, phone, age })
}
