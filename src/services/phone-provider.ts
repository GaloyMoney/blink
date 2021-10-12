import twilio from "twilio"

import { baseLogger } from "@services/logger"

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const apiKey = process.env.TWILIO_API_KEY
  const apiSecret = process.env.TWILIO_API_SECRET

  const client = twilio(apiKey, apiSecret, { accountSid })
  return client
}

export const sendTwilioText = async ({ body, to, logger }) => {
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
  const provider = "twilio"
  try {
    await getTwilioClient().messages.create({
      from: twilioPhoneNumber,
      to,
      body,
    })
  } catch (err) {
    logger.error({ err, provider }, "impossible to send text")
    return false
  }

  logger.info({ to, provider }, "sent text successfully")
  return true
}

export const getCarrier = async (phone: string) => {
  const result = await getTwilioClient()
    .lookups.phoneNumbers(phone)
    .fetch({ type: ["carrier"] })
  baseLogger.info({ result }, "result carrier info")
  return result
}
