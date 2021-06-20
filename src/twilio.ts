import { baseLogger } from './logger'
import twilio from 'twilio'


const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const apiKey = process.env.TWILIO_API_KEY
  const apiSecret = process.env.TWILIO_API_SECRET

  const client = twilio(apiKey, apiSecret, { accountSid })
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
