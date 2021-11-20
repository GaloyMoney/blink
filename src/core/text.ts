import { getGaloyInstanceName, getGaloySMSProvider, yamlConfig } from "@config/app"
import { IpFetcher } from "@services/ipfetcher"
import { PhoneCode } from "@services/mongoose/schema"
import { sendTwilioText } from "@services/phone-provider"
import moment from "moment"
import { TooManyRequestError } from "./error"
import { limiterRequestPhoneCode, limiterRequestPhoneCodeIp } from "./rate-limit"
import { randomIntFromInterval } from "./utils"

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

  const ipFetcher = IpFetcher()
  const ipDetails = await ipFetcher.fetchIPInfo(ip as IpAddress)
  if (ipDetails instanceof Error) {
    logger.warn({ ipDetails }, "Unable to fetch ip details")
  } else if (ipDetails.status === "denied" || ipDetails.status === "error") {
    logger.warn({ ipDetails }, "Unable to fetch ip details")
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
      const smsOk = await sendTwilioText(sendTextArguments)
      return smsOk
    } else {
      // sms provider in yaml did not match any sms implementation
      return false
    }
  } catch (err) {
    logger.error({ err }, "impossible to send message")
    return false
  }
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
      yamlConfig.test_accounts
        .filter((item) => item.phone === phone)[0]
        .code.toString() === code.toString()
    ) {
      // we are in this branch if phone is a test account + code is correct
    } else if (
      codes.findIndex((item) => item.code.toString() === code.toString()) === -1
    ) {
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
      user = await User.findOneAndUpdate(
        { phone },
        {},
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
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
