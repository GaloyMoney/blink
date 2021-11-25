import { getTwilioConfig } from "@config/app"
import { UnknownPhoneProviderServiceError } from "@domain/errors"
import { IPhoneProviderService } from "@domain/phone-provider/index.types"
import { baseLogger } from "@services/logger"
import twilio from "twilio"

export const TwilioClient = (): IPhoneProviderService => {
  const client = twilio(getTwilioConfig().apiKey, getTwilioConfig().apiSecret, {
    accountSid: getTwilioConfig().accountSid,
  })

  const sendText = async ({ body, to, logger }) => {
    const twilioPhoneNumber = getTwilioConfig().twilioPhoneNumber
    try {
      await client.messages.create({
        from: twilioPhoneNumber,
        to,
        body,
      })
    } catch (err) {
      logger.error({ err }, "impossible to send text")
      return new UnknownPhoneProviderServiceError(err)
    }

    logger.info({ to }, "sent text successfully")
    return true
  }

  const getCarrier = async (phone: PhoneNumber) => {
    try {
      const result = await client.lookups.phoneNumbers(phone).fetch({ type: ["carrier"] })
      baseLogger.info({ result }, "result carrier info")

      // TODO: migration to save the converted value to mongoose instead
      // of the one returned from twilio
      // const mappedValue = {
      //   carrier: {
      //     errorCode: result.carrier?.error_code,
      //     mobileCountryCode: result.carrier?.mobile_country_code,
      //     mobileNetworkCode: result.carrier?.mobile_network_code,
      //     name: result.carrier?.name,
      //     type: result.carrier?.type,
      //   },
      //   countryCode: result.countryCode,
      // }

      return result
    } catch (err) {
      return new UnknownPhoneProviderServiceError(err)
    }
  }

  return { getCarrier, sendText }
}
