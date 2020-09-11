const twilioPhoneNumber = "***REMOVED***"
import moment from "moment"
import { PhoneCode, User } from "./mongodb";

import { randomIntFromInterval, createToken, logger } from "./utils"

const getTwilioClient = () => {
  // FIXME: replace with env variable
  // and revoke credentials here
  const accountSID = "***REMOVED***"
  const authToken = "***REMOVED***"

  const client = require('twilio')(
    accountSID,
    authToken
  )

  return client
}

export const sendText = async ({ body, to }) => {
  await getTwilioClient().messages.create({
    from: twilioPhoneNumber,
    to,
    body,
  })
}

export const TEST_NUMBER = [
  { phone: "+16505554321", code: 321321, currency: "BTC" },
  { phone: "+16505554322", code: 321321, currency: "BTC" },
  { phone: "+16505554323", code: 321321, currency: "BTC" },
  { phone: "+16505554324", code: 321321, currency: "BTC" },
  { phone: "+16505554325", code: 321321, currency: "BTC" }, // funder

  { phone: "+16505554326", code: 321321, currency: "USD" }, // usd
  { phone: "+16505554326", code: 321321, currency: "BTC" }, // btc

  { phone: "+16505554327", code: 321321, currency: "BTC" }, // broker
]

export const requestPhoneCode = async ({ phone }) => {

  // make it possible to bypass the auth for testing purpose
  if (TEST_NUMBER.findIndex(item => item.phone === phone) !== -1) {
    return true
  }

  const code = randomIntFromInterval(100000, 999999)
  const body = `${code} is your verification code for Galoy`

  try {
    // TODO: only one code per 30 seconds should be generated.
    // otherwise an attack would be to call this enough time
    // in a row and ultimately randomly find a code

    await PhoneCode.create({ phone, code })

    await sendText({ body, to: phone })
  } catch (err) {
    console.error(err)
    return false
  }

  return true
}

interface ILogin {
  phone: string
  code: number
  currency?: string
}

export const login = async ({ phone, code, currency = "BTC" }: ILogin) => {
  
  // TODO: not sure if graphql return null or undefined when a field is not passed
  // adding this as an early catch for now
  if (!currency) {
    const err = `currency is not set. exiting login()`
    logger.error({currency}, err)
    throw Error(err)
  }

  try {
    const codes = await PhoneCode.find({
      phone,
      created_at: {
        $gte: moment().subtract(20, "minutes"),
      }
    })

    // is it a test account?
    if (TEST_NUMBER.findIndex(item => item.phone === phone) !== -1 &&
      TEST_NUMBER.filter(item => item.phone === phone)[0].code === code) {
      // we are in this branch if phone is a test account + code is correct
    } else if (codes.findIndex(item => item.code === code) === -1) {
      // this branch is both relevant for test and non-test accounts
      // for when the code is not correct
      console.warn(`code is not correct: ${code} with ${phone}`)
      return null
    }

    // code is correct
    // get User 
    const user = await User.findOneAndUpdate({ phone, currency }, { level: 1 }, { upsert: true, new: true })
    return createToken({ uid: user._id, currency })
    
  } catch (err) {
    console.error(err)
    throw err
  }
}
