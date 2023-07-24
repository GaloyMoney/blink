import { getGeetestConfig, getTestAccounts, getTwilioConfig } from "@config"
import { TestAccountsChecker } from "@domain/accounts/test-accounts-checker"
import { PhoneAlreadyExistsError } from "@domain/authentication/errors"
import { NotImplementedError } from "@domain/errors"
import { RateLimitConfig } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import Geetest from "@services/geetest"
import { AuthWithEmailPasswordlessService } from "@services/kratos"
import { baseLogger } from "@services/logger"
import { consumeLimiter } from "@services/rate-limit"
import { TWILIO_ACCOUNT_TEST, TwilioClient } from "@services/twilio"

export const requestPhoneCodeWithCaptcha = async ({
  phone,
  geetestChallenge,
  geetestValidate,
  geetestSeccode,
  ip,
  channel,
}: {
  phone: PhoneNumber
  geetestChallenge: string
  geetestValidate: string
  geetestSeccode: string
  ip: IpAddress
  channel: ChannelType
}): Promise<true | ApplicationError> => {
  const geeTestConfig = getGeetestConfig()
  const geetest = Geetest(geeTestConfig)

  const verifySuccess = await geetest.validate(
    geetestChallenge,
    geetestValidate,
    geetestSeccode,
  )
  if (verifySuccess instanceof Error) return verifySuccess

  return requestPhoneCodeForUnauthedUser({
    phone,
    ip,
    channel,
  })
}

export const requestPhoneCodeForUnauthedUser = async ({
  phone,
  ip,
  channel,
}: {
  phone: PhoneNumber
  ip: IpAddress
  channel: ChannelType
}): Promise<true | PhoneProviderServiceError> => {
  {
    const limitOk = await checkRequestCodeAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkRequestCodeAttemptPerLoginIdentifierLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkCodeAttemptPerLoginIdentifierMinIntervalLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  const testAccounts = getTestAccounts()
  if (TestAccountsChecker(testAccounts).isPhoneValid(phone)) {
    return true
  }

  if (getTwilioConfig().accountSid === TWILIO_ACCOUNT_TEST) {
    return new NotImplementedError("use test account for local dev and tests")
  }

  return TwilioClient().initiateVerify({ to: phone, channel })
}

export const requestPhoneCodeForAuthedUser = async ({
  phone,
  ip,
  channel,
  user,
}: {
  phone: PhoneNumber
  ip: IpAddress
  channel: ChannelType
  user: User
}): Promise<true | PhoneProviderServiceError> => {
  {
    const limitOk = await checkRequestCodeAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkRequestCodeAttemptPerLoginIdentifierLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkCodeAttemptPerLoginIdentifierMinIntervalLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  if (user.phone) {
    return new PhoneAlreadyExistsError()
  }

  const testAccounts = getTestAccounts()
  if (TestAccountsChecker(testAccounts).isPhoneValid(phone)) {
    return true
  }

  if (getTwilioConfig().accountSid === TWILIO_ACCOUNT_TEST) {
    return new NotImplementedError("use test account for local dev and tests")
  }

  return TwilioClient().initiateVerify({ to: phone, channel })
}

export const requestEmailCode = async ({
  email,
  ip,
}: {
  email: EmailAddress
  ip: IpAddress
}): Promise<EmailLoginId | EmailRegistrationId | KratosError> => {
  baseLogger.info({ email, ip }, "RequestEmailCode called")

  {
    const limitOk = await checkRequestCodeAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkRequestCodeAttemptPerLoginIdentifierLimits(email)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkCodeAttemptPerLoginIdentifierMinIntervalLimits(email)
    if (limitOk instanceof Error) return limitOk
  }

  const authServiceEmail = AuthWithEmailPasswordlessService()
  const flow = await authServiceEmail.sendEmailWithCode({ email })
  if (flow instanceof Error) return flow

  return flow
}

const checkRequestCodeAttemptPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.requestCodeAttemptPerIp,
    keyToConsume: ip,
  })

const checkRequestCodeAttemptPerLoginIdentifierLimits = async (
  loginIdentifier: LoginIdentifier,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.requestCodeAttemptPerLoginIdentifier,
    keyToConsume: loginIdentifier,
  })

const checkCodeAttemptPerLoginIdentifierMinIntervalLimits = async (
  loginIdentifier: LoginIdentifier,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.requestCodeAttemptPerLoginIdentifierMinInterval,
    keyToConsume: loginIdentifier,
  })
