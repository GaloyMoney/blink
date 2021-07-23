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
import * as Geetest from "../geetest/geetest"
import {
  failedAttemptPerIp,
  limiterLoginAttempt,
  limiterRequestPhoneCode,
  limiterRequestPhoneCodeIp,
} from "./rate-limit"
import {
  fetchIP,
  isIPBlacklisted,
  isIPTypeBlacklisted,
  randomIntFromInterval,
} from "./utils"

async function captchaVerifyGeetest(captchaChallenge, captchaValidate, captchaSeccode) {
  const result = await Geetest.validate(captchaChallenge, captchaValidate, captchaSeccode)
  return result.status === 1
  // return true
}

async function captchaVerifyGoogle(captcha) {
  const base_url = "https://www.google.com/recaptcha/api/siteverify"
  const secret = "TODO" // process.env.CAPTCHA_SECRET

  const response = await axios.post(
    base_url,
    querystring.stringify({ secret, response: captcha }),
  )
  // TODO
  return response.data.success === true
  // return true
}

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

  // TODO: making the ip check first here... maybe in both?

  let registerResponse = null
  if (!captchaRequired) {
    return registerResponse
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

  // TODO? any new limiter for the captcha?

  try {
    await limiterRequestPhoneCodeIp.consume(ip)
  } catch (err) {
    if (err instanceof Error) {
      throw err
    } else {
      throw new TooManyRequestError({ logger })
    }
  }

  registerResponse = await Geetest.register()
  return registerResponse
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
  //
  // Maybe abstract all these by receiving them also through 'captchaResponse'?

  // TODO
  const captchaRequired = captchaChallenge && captchaValidate && captchaSeccode
  // const captchaRequired = captchaResponse ? captchaResponse.length > 0 : false
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
      // throw new CaptchaFailedError("Captcha Required", { logger, captchaResponse })
    }
    const success = await captchaVerifyGeetest(
      captchaChallenge,
      captchaValidate,
      captchaSeccode,
    )
    // const success = await captchaVerifyGoogle(captchaResponse)
    if (!success) {
      throw new CaptchaFailedError("Captcha Invalid", {
        logger,
        captchaChallenge,
        captchaValidate,
        captchaSeccode,
      })
      // throw new CaptchaFailedError("Captcha Invalid", { logger, captchaResponse })
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
  captchaResponse,
  logger,
  ip,
}: {
  phone: string
  captchaResponse?: string
  logger: Logger
  ip: string
}): Promise<boolean> => {
  logger.info({ phone, ip }, "RequestPhoneCode called")

  // TODO
  const captchaRequired = captchaResponse ? captchaResponse.length > 0 : false
  // const captchaRequired = false

  if (captchaRequired) {
    if (!captchaResponse) {
      throw new CaptchaFailedError("Captcha Required", { logger, captchaResponse })
    }
    const success = await captchaVerifyGoogle(captchaResponse)
    if (!success) {
      throw new CaptchaFailedError("Captcha Invalid", { logger, captchaResponse })
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
