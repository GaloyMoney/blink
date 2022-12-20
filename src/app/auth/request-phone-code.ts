import { getTestAccounts, getTwilioConfig } from "@config"
import { TestAccountsChecker } from "@domain/accounts/test-accounts-checker"
import { NotImplementedError } from "@domain/errors"
import { RateLimitConfig } from "@domain/rate-limit"
import { RateLimiterExceededError } from "@domain/rate-limit/errors"
import { consumeLimiter } from "@services/rate-limit"
import { TwilioClient } from "@services/twilio"

export const requestPhoneCodeWithCaptcha = async ({
  phone,
  geetest,
  geetestChallenge,
  geetestValidate,
  geetestSeccode,
  logger,
  ip,
}: {
  phone: PhoneNumber
  geetest: GeetestType
  geetestChallenge: string
  geetestValidate: string
  geetestSeccode: string
  logger: Logger
  ip: IpAddress
}): Promise<true | ApplicationError> => {
  logger.info({ phone, ip }, "RequestPhoneCodeGeetest called")

  const verifySuccess = await geetest.validate(
    geetestChallenge,
    geetestValidate,
    geetestSeccode,
  )
  if (verifySuccess instanceof Error) return verifySuccess

  return requestPhoneCode({
    phone,
    logger,
    ip,
  })
}

export const requestPhoneCode = async ({
  phone,
  logger,
  ip,
}: {
  phone: PhoneNumber
  logger: Logger
  ip: IpAddress
}): Promise<true | PhoneProviderServiceError> => {
  logger.info({ phone, ip }, "RequestPhoneCode called")

  {
    const limitOk = await checkPhoneCodeAttemptPerIpLimits(ip)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkPhoneCodeAttemptPerPhoneLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  {
    const limitOk = await checkPhoneCodeAttemptPerPhoneMinIntervalLimits(phone)
    if (limitOk instanceof Error) return limitOk
  }

  const testAccounts = getTestAccounts()
  if (TestAccountsChecker(testAccounts).isPhoneValid(phone)) {
    return true
  }

  if (getTwilioConfig().accountSid === "AC_twilio_id") {
    return new NotImplementedError("use test account for local dev and tests")
  }

  return TwilioClient().initiateVerify(phone)
}

const checkPhoneCodeAttemptPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.requestPhoneCodeAttemptPerIp,
    keyToConsume: ip,
  })

const checkPhoneCodeAttemptPerPhoneLimits = async (
  phone: PhoneNumber,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.requestPhoneCodeAttemptPerPhone,
    keyToConsume: phone,
  })

const checkPhoneCodeAttemptPerPhoneMinIntervalLimits = async (
  phone: PhoneNumber,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.requestPhoneCodeAttemptPerPhoneMinInterval,
    keyToConsume: phone,
  })
