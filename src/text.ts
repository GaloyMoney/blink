import twilio from 'twilio';
import moment from "moment"
import { PhoneCode, User } from "./schema";
import { createToken } from "./jwt"
import { yamlConfig } from "./config";
import { baseLogger } from './logger'
import { fetchIP, randomIntFromInterval } from "./utils"
import { failedAttemptPerIp, limiterLoginAttempt, limiterRequestPhoneCode } from "./rateLimit"
import { TooManyRequestError } from "./error";

const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const apiKey = process.env.TWILIO_API_KEY
  const apiSecret = process.env.TWILIO_API_SECRET

  const client = twilio(apiKey, apiSecret, { accountSid });
  return client
}

export const sendText = async ({ body, to, logger }) => {
  try {
    await getTwilioClient().messages.create({
      from: twilioPhoneNumber,
      to,
      body,
    })
  } catch (err) {
    logger.fatal({err}, "impossible to send text")
    return
  }

  logger.info({to}, "sent text successfully")
}

export const getCarrier = async (phone: string) => {
  const result = await getTwilioClient().lookups.phoneNumbers(phone).fetch({type: ['carrier']})
  baseLogger.info({result}, "result carrier info")
  return result
}

export const requestPhoneCode = async ({ phone, logger, ip }: {phone: string, logger: any, ip: string}): Promise<Boolean> => {

  try {
    await limiterRequestPhoneCode.consume(phone);
  } catch(err) {
    if (err instanceof Error) {
      throw err;
    } else {
      throw new TooManyRequestError({ logger })
    }
  }

  // make it possible to bypass the auth for testing purpose
  if (yamlConfig.test_accounts.findIndex(item => item.phone === phone) !== -1) {
    return true
  }

  try {
    const ipDetails = await fetchIP({ip})
    if(ipDetails?.type == "VPN") {
      logger.warn({ip}, "RequestPhoneCode: called by a VPN IP")
      return false
    }
  } catch(err) {
    logger.warn({err}, "RequestPhoneCode: Couldn't fetch ip details")
  }

  const code = randomIntFromInterval(100000, 999999)
  const body = `${code} is your verification code for ${yamlConfig.name}`

  try {
    const veryRecentCode = await PhoneCode.findOne({
      phone,
      created_at: {
        $gte: moment().subtract(30, "seconds"),
      }
    })

    if (!!veryRecentCode) {
      return false
    }

    await PhoneCode.create({ phone, code })
    await sendText({ body, to: phone, logger })
  } catch (err) {
    logger.error({err}, "impossible to send message")
    return false
  }

  return true
}

interface ILogin {
  phone: string
  code: number
  logger: any
  ip: string
}

export const login = async ({ phone, code, logger, ip }: ILogin): Promise<string | null> => {
  const subLogger = logger.child({topic: "login"})

  const rlResult = await failedAttemptPerIp.get(ip);
  if (rlResult !== null && rlResult.consumedPoints > yamlConfig.limits.failedAttemptPerIp.points) {
    throw new TooManyRequestError({ logger })
  }

  try {
    await limiterLoginAttempt.consume(phone);
  } catch(err) {
    if (err instanceof Error) {
      throw err;
    } else {
      throw new TooManyRequestError({ logger })
    }
  }

  try {
    const codes = await PhoneCode.find({
      phone,
      created_at: {
        $gte: moment().subtract(20, "minutes"),
      }
    })

    // is it a test account?
    if (yamlConfig.test_accounts.findIndex(item => item.phone === phone) !== -1 &&
      yamlConfig.test_accounts.filter(item => item.phone === phone)[0].code === code) {
      // we are in this branch if phone is a test account + code is correct
    } else if (codes.findIndex(item => item.code === code) === -1) {
      // this branch is both relevant for test and non-test accounts
      // for when the code is not correct
      subLogger.warn({ phone, code }, `user enter incorrect code`)

      try {
        await failedAttemptPerIp.consume(ip);
      } catch (err) {
        logger.error({ip}, "impossible to consume failedAttemptPerIp")
      }

      return null
    }

    // code is correct

    // reseting the limiter for this phone
    limiterLoginAttempt.delete(phone) // no need to await the promise

    // get User 
    let user

    user = await User.findOne({ phone })

    if (user) {
      subLogger.info({ phone }, "user logged in")
    } else {
      user = await User.findOneAndUpdate({ phone }, {}, { upsert: true, new: true })
      subLogger.info({ phone } , "a new user has register")
    }

    // TODO
    // if (yamlConfig.carrierRegexFilter)  {
    // 
    // }
    //
    // only fetch info once
    if (user.twilio.countryCode == undefined) {
      try {
        const result = await getCarrier(phone)
        user.twilio = result
        await user.save()
      } catch (err) {
        // Carrier fetching is a non-critical operation
        // Primarily useful for analytics
        // Hence failure should be handled with a warn instead of an error
        subLogger.warn({err}, "impossible to fetch carrier")
      }
    }

    const network = process.env.NETWORK
    return createToken({ uid: user._id, network })
    
  } catch (err) {
    subLogger.error({err}, "login issue")
    throw err
  }
}
