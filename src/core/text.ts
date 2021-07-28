import axios from "axios"
import moment from "moment"
import querystring from "querystring"

import {
  yamlConfig,
  getGaloyInstanceName,
  getGaloySMSProvider,
  getFailedAttemptPerIpLimits,
} from "@config/app"

import { createToken } from "@services/jwt"
import { sendTwilioText, getCarrier, sendSMSalaText } from "@services/phone-provider"
import { PhoneCode, User } from "@services/mongoose/schema"

import { CaptchaFailedError, IPBlacklistedError, TooManyRequestError } from "./error"
import {
  failedAttemptPerIp,
  limiterLoginAttempt,
  limiterRequestPhoneCode,
  limiterRequestPhoneCodeIp,
} from "./rate-limit"
import {
  fetchIP,
  geetest,
  isIPBlacklisted,
  isIPTypeBlacklisted,
  randomIntFromInterval,
} from "./utils"

export const registerCaptchaGeetest = async ({
  logger,
  ip,
}: {
  logger: Logger
  ip: string
}): Promise<string | null> => {
  logger.info({ ip }, "RegisterCaptchaGeetest called")

  // TODO
  const captchaRequired = true
  // const captchaRequired = false

  // TODO? any bypass?

  // TODO? ip checks?

  // TODO? any new limiter for the captcha?

  if (!captchaRequired) {
    return null // TODO?
  }

  // TODO error handling
  const registerResponse = await geetest.register()
  return registerResponse
}

async function captchaVerifyGeetest(captchaChallenge, captchaValidate, captchaSeccode) {
  const result = await geetest.validate(captchaChallenge, captchaValidate, captchaSeccode)
  return result.status === 1
}

export const requestPhoneCodeGeetest = async ({
  phone,
  captchaChallenge,
  captchaValidate,
  captchaSeccode,
  logger,
  ip,
}: {
  phone: string
  captchaChallenge?: string
  captchaValidate?: string
  captchaSeccode?: string
  logger: Logger
  ip: string
}): Promise<boolean> => {
  logger.info({ phone, ip }, "RequestPhoneCode called")

  // const challenge = req.body[GeetestLib.GEETEST_CHALLENGE];
  // const validate = req.body[GeetestLib.GEETEST_VALIDATE];
  // const seccode = req.body[GeetestLib.GEETEST_SECCODE];

  // TODO
  const captchaRequired = captchaChallenge && captchaValidate && captchaSeccode
  // const captchaRequired = false

  // TODO before or after ip?

  if (captchaRequired) {
    if (!(captchaChallenge && captchaValidate && captchaSeccode)) {
      // if (!captchaResponse) {
      throw new CaptchaFailedError("Captcha Required", {
        logger,
        captchaChallenge,
        captchaValidate,
        captchaSeccode,
      })
    }
    const success = await captchaVerifyGeetest(
      captchaChallenge,
      captchaValidate,
      captchaSeccode,
    )
    if (!success) {
      throw new CaptchaFailedError("Captcha Invalid", {
        logger,
        captchaChallenge,
        captchaValidate,
        captchaSeccode,
      })
    }
  }

  if (isIPBlacklisted({ ip })) {
    throw new IPBlacklistedError("IP Blacklisted", { logger, ip })
  }

  let ipDetails

  try {
    ipDetails = await fetchIP({ ip })
  } catch (err) {
    logger.warn({ err }, "Unable to fetch ip details")
  }

  if (!ipDetails || ipDetails.status === "denied" || ipDetails.status === "error") {
    logger.warn({ ipDetails }, "Unable to fetch ip details")
  }

  if (isIPTypeBlacklisted({ type: ipDetails?.type })) {
    throw new IPBlacklistedError("IP type Blacklisted", { logger, ipDetails })
  }

  try {
    await limiterRequestPhoneCode.consume(phone)
  } catch (err) {
    if (err instanceof Error) {
      throw err
    } else {
      throw new TooManyRequestError({ logger })
    }
  }

  try {
    await limiterRequestPhoneCodeIp.consume(ip)
  } catch (err) {
    if (err instanceof Error) {
      throw err
    } else {
      throw new TooManyRequestError({ logger })
    }
  }

  // make it possible to bypass the auth for testing purpose
  if (yamlConfig.test_accounts.findIndex((item) => item.phone === phone) !== -1) {
    return true
  }

  const code = randomIntFromInterval(100000, 999999)
  const body = `${code} is your verification code for ${yamlConfig.name}`
  const sms_provider = yamlConfig.sms_provider.toLowerCase()

  try {
    const veryRecentCode = await PhoneCode.findOne({
      phone,
      created_at: {
        $gte: moment().subtract(30, "seconds"),
      },
    })

    if (veryRecentCode) {
      return false
    }

    await PhoneCode.create({ phone, code, sms_provider })

    const sendTextArguments = { body, to: phone, logger }
    if (sms_provider === "twilio") {
      await sendTwilioText(sendTextArguments)
    } else if (sms_provider === "smsala") {
      await sendSMSalaText(sendTextArguments)
    } else {
      // sms provider in yaml did not match any sms implementation
      return false
    }
  } catch (err) {
    logger.error({ err }, "impossible to send message")
    return false
  }

  return true
}

export const requestPhoneCode = async ({
  phone,
  logger,
  ip,
}: {
  phone: string
  logger: Logger
  ip: string
}): Promise<boolean> => {
  logger.info({ phone, ip }, "RequestPhoneCode called")

  if (isIPBlacklisted({ ip })) {
    throw new IPBlacklistedError("IP Blacklisted", { logger, ip })
  }

  let ipDetails

  try {
    ipDetails = await fetchIP({ ip })
  } catch (err) {
    logger.warn({ err }, "Unable to fetch ip details")
  }

  if (!ipDetails || ipDetails.status === "denied" || ipDetails.status === "error") {
    logger.warn({ ipDetails }, "Unable to fetch ip details")
  }

  if (isIPTypeBlacklisted({ type: ipDetails?.type })) {
    throw new IPBlacklistedError("IP type Blacklisted", { logger, ipDetails })
  }

  try {
    await limiterRequestPhoneCode.consume(phone)
  } catch (err) {
    if (err instanceof Error) {
      throw err
    } else {
      throw new TooManyRequestError({ logger })
    }
  }

  try {
    await limiterRequestPhoneCodeIp.consume(ip)
  } catch (err) {
    if (err instanceof Error) {
      throw err
    } else {
      throw new TooManyRequestError({ logger })
    }
  }

  // make it possible to bypass the auth for testing purpose
  if (yamlConfig.test_accounts.findIndex((item) => item.phone === phone) !== -1) {
    return true
  }

  const code = randomIntFromInterval(100000, 999999)
  const galoyInstanceName = getGaloyInstanceName()
  const body = `${code} is your verification code for ${galoyInstanceName}`
  const sms_provider = getGaloySMSProvider().toLowerCase()

  try {
    const veryRecentCode = await PhoneCode.findOne({
      phone,
      created_at: {
        $gte: moment().subtract(30, "seconds"),
      },
    })

    if (veryRecentCode) {
      return false
    }

    await PhoneCode.create({ phone, code, sms_provider })

    const sendTextArguments = { body, to: phone, logger }
    if (sms_provider === "twilio") {
      await sendTwilioText(sendTextArguments)
    } else if (sms_provider === "smsala") {
      await sendSMSalaText(sendTextArguments)
    } else {
      // sms provider in yaml did not match any sms implementation
      return false
    }
  } catch (err) {
    logger.error({ err }, "impossible to send message")
    return false
  }

  return true
}

interface ILogin {
  phone: string
  code: number
  logger: Logger
  ip: string
}

export const login = async ({
  phone,
  code,
  logger,
  ip,
}: ILogin): Promise<string | null> => {
  const subLogger = logger.child({ topic: "login" })

  const rlResult = await failedAttemptPerIp.get(ip)
  const failedAttemptPerIpLimits = getFailedAttemptPerIpLimits()
  if (rlResult !== null && rlResult.consumedPoints > failedAttemptPerIpLimits.points) {
    throw new TooManyRequestError({ logger })
  }

  try {
    await limiterLoginAttempt.consume(phone)
  } catch (err) {
    if (err instanceof Error) {
      throw err
    } else {
      throw new TooManyRequestError({ logger })
    }
  }

  try {
    const codes = await PhoneCode.find({
      phone,
      created_at: {
        $gte: moment().subtract(20, "minutes"),
      },
    })

    // is it a test account?
    if (
      yamlConfig.test_accounts.findIndex((item) => item.phone === phone) !== -1 &&
      yamlConfig.test_accounts.filter((item) => item.phone === phone)[0].code === code // TODO: change code to string everywhere
    ) {
      // we are in this branch if phone is a test account + code is correct
    } else if (codes.findIndex((item) => item.code === code) === -1) {
      // this branch is both relevant for test and non-test accounts
      // for when the code is not correct
      subLogger.warn({ phone, code }, `user enter incorrect code`)

      try {
        await failedAttemptPerIp.consume(ip)
      } catch (err) {
        logger.error({ ip }, "impossible to consume failedAttemptPerIp")
      }

      return null
    }

    // code is correct

    // reseting the limiter for this phone
    limiterLoginAttempt.delete(phone) // no need to await the promise

    // rewarding the ip address at the request code level
    limiterRequestPhoneCodeIp.reward(ip)

    // get User
    let user

    user = await User.findOne({ phone })

    if (user) {
      subLogger.info({ phone }, "user logged in")
    } else {
      user = await User.findOneAndUpdate({ phone }, {}, { upsert: true, new: true })
      subLogger.info({ phone }, "a new user has register")
    }

    // TODO
    // if (yamlConfig.carrierRegexFilter)  {
    //
    // }

    // only fetch info once
    if (user.twilio.countryCode === undefined || user.twilio.countryCode === null) {
      try {
        const result = await getCarrier(phone)
        user.twilio = result
        await user.save()
      } catch (err) {
        // Carrier fetching is a non-critical operation
        // Primarily useful for analytics
        // Hence failure should be handled with a warn instead of an error
        subLogger.warn({ err }, "impossible to fetch carrier")
      }
    }

    const network = process.env.NETWORK
    return createToken({ uid: user._id, network })
  } catch (err) {
    subLogger.error({ err }, "login issue")
    throw err
  }
}
