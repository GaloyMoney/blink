import {
  createAccountForEmailIdentifier,
  createAccountWithPhoneIdentifier,
} from "@app/accounts/create-account"
import {
  BTC_NETWORK,
  getDefaultAccountsConfig,
  getFailedLoginAttemptPerIpLimits,
  getFailedLoginAttemptPerPhoneLimits,
  getTestAccounts,
  MAX_AGE_TIME_CODE,
} from "@config"

import { checkedToKratosUserId } from "@domain/accounts"
import { TestAccountsChecker } from "@domain/accounts/test-accounts-checker"
import { CouldNotFindAccountFromKratosIdError } from "@domain/errors"
import { RateLimitConfig, RateLimitPrefix } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { checkedToEmailAddress } from "@domain/users"
import { AuthWithPhonePasswordlessService } from "@services/kratos"
import { LikelyNoUserWithThisPhoneExistError } from "@services/kratos/errors"
import { createToken } from "@services/legacy-jwt"

import { AccountsRepository } from "@services/mongoose"
import { PhoneCodesRepository } from "@services/mongoose/phone-code"
import { consumeLimiter, RedisRateLimitService } from "@services/rate-limit"
import { addAttributesToCurrentSpan } from "@services/tracing"

export const loginWithPhone = async ({
  phone,
  code,
  ip,
}: {
  phone: PhoneNumber
  code: PhoneCode
  ip: IpAddress
}): Promise<SessionToken | LegacyJwtToken | ApplicationError> => {
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

  // FIXME: this is a fuzzy error. we can't create a new user on this pattern
  // need to use hook
  if (kratosResult instanceof LikelyNoUserWithThisPhoneExistError) {
    // user has not migrated to kratos or it's a new user

    kratosResult = await authService.createIdentityWithSession(phone)
    if (kratosResult instanceof Error) return kratosResult
    addAttributesToCurrentSpan({ "login.newAccount": true })

    kratosToken = kratosResult.sessionToken
    kratosUserId = kratosResult.kratosUserId

    // TODO: look at where is phone metadata stored
    const accountRaw: NewAccountWithPhoneIdentifier = { kratosUserId, phone }
    const account = await createAccountWithPhoneIdentifier({
      newAccountInfo: accountRaw,
      config: getDefaultAccountsConfig(),
    })

    if (account instanceof Error) return account
  } else if (kratosResult instanceof Error) {
    return kratosResult
  } else {
    kratosToken = kratosResult.sessionToken
    kratosUserId = kratosResult.kratosUserId
  }

  // TODO: apply after migration of the mobile app
  const returnNewKratosToken = false

  if (!returnNewKratosToken) {
    const account = await AccountsRepository().findByKratosUserId(kratosUserId)
    if (account instanceof Error) return account

    return createToken({ uid: account.id, network: BTC_NETWORK })
  }

  return kratosToken
}

export const loginWithEmail = async ({
  kratosUserId,
  emailAddress,
  ip,
}: {
  kratosUserId: string
  emailAddress: string
  ip: IpAddress
}): Promise<{ accountStatus: string } | ApplicationError> => {
  const kratosUserIdValid = checkedToKratosUserId(kratosUserId)
  if (kratosUserIdValid instanceof Error) return kratosUserIdValid

  const emailAddressValid = checkedToEmailAddress(emailAddress)
  if (emailAddressValid instanceof Error) return emailAddressValid

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
