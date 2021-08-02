import axios from "axios"
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
    return
  }

  logger.info({ to, provider }, "sent text successfully")
}

export const sendSMSalaText = async ({ body, to, logger }) => {
  const provider = "smsala"
  try {
    const base_url = "http://api.smsala.com/api/SendSMS"
    const api_id = process.env.SMSALA_API_ID
    const api_password = process.env.SMSALA_API_PASSWORD
    const sms_type = "T"
    const encoding = "T"
    const sender_id = process.env.SMSALA_SENDER_ID
    // SMSala api does not acccept nonnumeric characters like '+'
    const phoneNumber = to.replace(/\D/g, "")

    let url = `${base_url}?api_id=${api_id}&api_password=${api_password}`
    url = url + `&sms_type=${sms_type}&encoding=${encoding}&sender_id=${sender_id}`
    url = url + `&phonenumber=${phoneNumber}&textmessage=${body}`
    await axios.get(url)
  } catch (err) {
    logger.error({ err, provider }, "impossible to send text")
    return
  }

  logger.info({ to, provider }, "sent text successfully")
}

export const getCarrier = async (phone: string) => {
  const result = await getTwilioClient()
    .lookups.phoneNumbers(phone)
    .fetch({ type: ["carrier"] })
  baseLogger.info({ result }, "result carrier info")
  return result
}
