import {
  getGaloyInstanceName,
  getRequestPhoneCodeIpLimits,
  getRequestPhoneCodeLimits,
  getRequestPhoneCodeMinInterval,
} from "@config/app"
import { randomIntFromInterval } from "@core/utils"
import { UnknownPhoneProviderServiceError } from "@domain/phone-provider"
import { RateLimitPrefix } from "@domain/rate-limit"
import {
  RateLimiterExceededError,
  UserPhoneCodeAttemptIpRateLimiterExceededError,
  UserPhoneCodeAttemptMinIntervalLimiterExceededError,
  UserPhoneCodeAttemptPhoneRateLimiterExceededError,
} from "@domain/rate-limit/errors"
import { PhoneCodesRepository } from "@services/mongoose/phone-code"
import { RedisRateLimitService } from "@services/rate-limit"
import { TwilioClient } from "@services/twilio"
import { isTestAccountPhone } from "."

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
}): Promise<true | GeetestError | UnknownPhoneProviderServiceError> => {
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
}): Promise<true | UnknownPhoneProviderServiceError> => {
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
    const limitOk = await checkPhoneCodeAttemptMinInternal(phone)
    if (limitOk instanceof Error) return limitOk
  }

  if (isTestAccountPhone(phone)) {
    return true
  }

  const code = String(randomIntFromInterval(100000, 999999)) as PhoneCode
  const galoyInstanceName = getGaloyInstanceName()
  const body = `${code} is your verification code for ${galoyInstanceName}`

  const result = await PhoneCodesRepository().persistNew({ phone, code })
  if (result instanceof Error) return result

  const sendTextArguments = { body, to: phone, logger }

  return TwilioClient().sendText(sendTextArguments)
}

const checkPhoneCodeAttemptPerIpLimits = async (
  ip: IpAddress,
): Promise<true | RateLimiterExceededError> => {
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.failedAttemptPhoneCodeIp,
    limitOptions: getRequestPhoneCodeIpLimits(),
  })
  const limitOk = await limiter.consume(ip)
  if (limitOk instanceof RateLimiterExceededError)
    return new UserPhoneCodeAttemptIpRateLimiterExceededError()
  return limitOk
}

const checkPhoneCodeAttemptPerPhoneLimits = async (
  phone: PhoneNumber,
): Promise<true | RateLimiterExceededError> => {
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.failedPhoneCodeAttemptPhoneCode,
    limitOptions: getRequestPhoneCodeLimits(),
  })
  const limitOk = await limiter.consume(phone)
  if (limitOk instanceof RateLimiterExceededError)
    return new UserPhoneCodeAttemptPhoneRateLimiterExceededError()
  return limitOk
}

const checkPhoneCodeAttemptMinInternal = async (
  phone: PhoneNumber,
): Promise<true | RateLimiterExceededError> => {
  const limiter = RedisRateLimitService({
    keyPrefix: RateLimitPrefix.phoneCodeAttemptMinInternal,
    limitOptions: getRequestPhoneCodeMinInterval(),
  })
  const limitOk = await limiter.consume(phone)
  if (limitOk instanceof RateLimiterExceededError)
    return new UserPhoneCodeAttemptMinIntervalLimiterExceededError()
  return limitOk
}
