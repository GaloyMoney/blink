import { createAccountForEmailSchema, createAccountForPhoneSchema } from "@app/accounts"
import {
  getDefaultAccountsConfig,
  getFailedLoginAttemptPerIpLimits,
  getFailedLoginAttemptPerPhoneLimits,
  getTestAccounts,
  MAX_AGE_TIME_CODE,
} from "@config"
import { checkedToKratosUserId } from "@domain/accounts"
import { TestAccountsChecker } from "@domain/accounts/test-accounts-checker"
import {
  CouldNotFindAccountFromKratosIdError,
  CouldNotFindUserFromPhoneError,
} from "@domain/errors"
import { RateLimitConfig, RateLimitPrefix } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { checkedToEmailAddress } from "@domain/users"
import { LikelyNoUserWithThisPhoneExistError } from "@domain/users/errors"
import {
  createKratosUserForPhoneNoPasswordSchema,
  loginForPhoneNoPasswordSchema,
} from "@services/kratos"
import { AccountsRepository, UsersRepository } from "@services/mongoose"
import { PhoneCodesRepository } from "@services/mongoose/phone-code"
import { consumeLimiter, RedisRateLimitService } from "@services/rate-limit"

export const loginWithPhone = async ({
  phone,
  code,
  logger,
  ip,
}: {
  phone: PhoneNumber
  code: PhoneCode
  logger: Logger
  ip: IpAddress
}): Promise<KratosSessionToken | ApplicationError> => {
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

  let kratosToken: KratosSessionToken

  let kratosResult = await loginForPhoneNoPasswordSchema(phone)
  if (kratosResult instanceof LikelyNoUserWithThisPhoneExistError) {
    // user has not migrated to kratos or it's a new user

    kratosResult = await createKratosUserForPhoneNoPasswordSchema(phone)
    if (kratosResult instanceof Error) return kratosResult

    kratosToken = kratosResult.sessionToken
    const kratosUserId = kratosResult.kratosUserId

    const user = await UsersRepository().findByPhone(phone)
    if (user instanceof CouldNotFindUserFromPhoneError) {
      // brand new user
      subLogger.info({ phone }, "new user signup")

      const accountRaw: NewAccountInfo = { phone, kratosUserId }
      const account_ = await createAccountForPhoneSchema({
        newAccountInfo: accountRaw,
        config: getDefaultAccountsConfig(),
      })

      account_
    } else {
      if (user instanceof Error) return user
      else {
        // account exist but doesn't have a kratos user yet

        let account = await AccountsRepository().findByUserId(user.id)
        if (account instanceof Error) return account

        account = await AccountsRepository().attachKratosUser({
          id: account.id,
          kratosUserId,
        })
      }
    }
  } else if (kratosResult instanceof Error) {
    return kratosResult
  } else {
    kratosToken = kratosResult.sessionToken
  }

  return kratosToken
}

export const loginWithEmail = async ({
  kratosUserId,
  emailAddress,
  logger,
  ip,
}: {
  kratosUserId: string
  emailAddress: string
  logger: Logger
  ip: IpAddress
}): Promise<{ accountStatus: string } | ApplicationError> => {
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
    account = await createAccountForEmailSchema({
      kratosUserId: kratosUserIdValid,
      config: getDefaultAccountsConfig(),
    })
  }
  if (account instanceof Error) return account

  return {
    accountStatus: account.status.toUpperCase(),
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
