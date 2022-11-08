import {
  createAccountForEmailIdentifier,
  createAccountWithPhoneIdentifier,
} from "@app/accounts/create-account"
import {
  getDefaultAccountsConfig,
  getFailedLoginAttemptPerIpLimits,
  getFailedLoginAttemptPerPhoneLimits,
  getTestAccounts,
  MAX_AGE_TIME_CODE,
} from "@config"

import { checkedToKratosUserId } from "@domain/accounts"
import { TestAccountsChecker } from "@domain/accounts/test-accounts-checker"
import { LikelyNoUserWithThisPhoneExistError } from "@domain/authentication/errors"
import {
  CouldNotFindAccountFromKratosIdError,
  CouldNotFindUserFromPhoneError,
} from "@domain/errors"
import { RateLimitConfig, RateLimitPrefix } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { ErrorLevel } from "@domain/shared"
import { checkedToEmailAddress } from "@domain/users"
import { AuthWithPhonePasswordlessService } from "@services/kratos"

import { AccountsRepository, UsersRepository } from "@services/mongoose"
import { PhoneCodesRepository } from "@services/mongoose/phone-code"
import { consumeLimiter, RedisRateLimitService } from "@services/rate-limit"
import {
  addAttributesToCurrentSpan,
  recordExceptionInCurrentSpan,
} from "@services/tracing"

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
}): Promise<SessionToken | LegacyJwtToken | ApplicationError> => {
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

  let kratosToken: SessionToken
  let kratosUserId: KratosUserId

  const authService = AuthWithPhonePasswordlessService()

  let kratosResult = await authService.login(phone)
  if (kratosResult instanceof LikelyNoUserWithThisPhoneExistError) {
    // user has not migrated to kratos or it's a new user

    kratosResult = await authService.createIdentityWithSession(phone)
    if (kratosResult instanceof Error) return kratosResult
    addAttributesToCurrentSpan({ "login.newAccount": true })

    kratosToken = kratosResult.sessionToken
    kratosUserId = kratosResult.kratosUserId

    const user = await UsersRepository().findByPhone(phone)
    if (user instanceof CouldNotFindUserFromPhoneError) {
      // brand new user
      subLogger.info({ phone }, "new user signup")

      // TODO: look at where is phone metadata stored
      const accountRaw: NewAccountWithPhoneIdentifier = { kratosUserId, phone }
      const account = await createAccountWithPhoneIdentifier({
        newAccountInfo: accountRaw,
        config: getDefaultAccountsConfig(),
      })

      if (account instanceof Error) return account
    } else if (user instanceof Error) {
      return user
    } else {
      // account exist but doesn't have a kratos user yet

      let account = await AccountsRepository().findByUserId(user.id)
      if (account instanceof Error) return account

      account = await AccountsRepository().update({
        ...account,
        kratosUserId,
      })

      if (account instanceof Error) {
        recordExceptionInCurrentSpan({
          error: `error with attachKratosUser login: ${account}`,
          level: ErrorLevel.Critical,
          attributes: { kratosUserId, id: user.id, phone },
        })
      }
    }
  } else if (kratosResult instanceof Error) {
    return kratosResult
  } else {
    kratosToken = kratosResult.sessionToken
    kratosUserId = kratosResult.kratosUserId
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
    addAttributesToCurrentSpan({ "login.newAccount": true })
    account = await createAccountForEmailIdentifier({
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
  if (validTestCode) return true

  return PhoneCodesRepository().existNewerThan({ code, phone, age })
}
