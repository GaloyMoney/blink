const twilioPhoneNumber = "***REMOVED***"
import moment from "moment"
import { PhoneCode, User } from "./mongodb";

import { randomIntFromInterval, createToken, LoggedError } from "./utils"

const projectName = "***REMOVED*** Wallet"

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
  { phone: "+16505554321", code: 321321 }, // user0
  { phone: "+16505554322", code: 321321 }, // user1
  { phone: "+16505554323", code: 321321 }, // user2
  { phone: "+16505554324", code: 321321 }, // user3
  { phone: "+16505554325", code: 321321, username: "***REMOVED***" }, // user4/ funder
  
  { phone: "+16505554326", code: 321321, currencies: [{id: "USD", ratio: 1}] }, // usd
  
  { phone: "+16505554327", code: 321321, role: "broker" }, // broker //user6
  { phone: "+16505554328", code: 321321 }, // 
  { phone: "+16505554329", code: 321321 }, // postman
  { phone: "+16505554330", code: 321321, currencies: [{id: "USD", ratio: .5}, {id: "BTC", ratio: .5},] }, // usd bis

  { phone: "+***REMOVED***", code: 321321 }, // for manual testing
]

export const requestPhoneCode = async ({ phone, logger }) => {

  // make it possible to bypass the auth for testing purpose
  if (TEST_NUMBER.findIndex(item => item.phone === phone) !== -1) {
    return true
  }

  const code = randomIntFromInterval(100000, 999999)
  const body = `${code} is your verification code for ${projectName}`

  try {
    // TODO: only one code per 30 seconds should be generated.
    // otherwise an attack would be to call this enough time
    // in a row and ultimately randomly find a code

    await PhoneCode.create({ phone, code })

    await sendText({ body, to: phone })
  } catch (err) {
    logger.error(err)
    return false
  }

  return true
}

interface ILogin {
  phone: string
  code: number
  currency?: string
  logger: any
}

export const login = async ({ phone, code, logger }: ILogin) => {
  const subLogger = logger.child({topic: "login"})

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
      subLogger.warn({ phone, code }, `user enter incorrect code`)
      return null
    }

    // code is correct
    
    // get User 
    let user

    user = await User.findOne({ phone })

    if (user) {
      subLogger.info({ phone }, "user logged in")
    } else {
      user = await User.findOneAndUpdate({ phone }, {}, { upsert: true, new: true })
      subLogger.info({ phone } , "a new user has register")
    }

    const network = process.env.NETWORK
    return createToken({ uid: user._id, network })
    
  } catch (err) {
    subLogger.error({err})
    throw err
  }
}
