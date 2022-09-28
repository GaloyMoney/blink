import twilio from "twilio"

import { getTwilioConfig } from "@config"
import {
  InvalidPhoneNumberPhoneProviderError,
  PhoneProviderConnectionError,
  RestrictedRegionPhoneProviderError,
  UnknownPhoneProviderServiceError,
  UnsubscribedRecipientPhoneProviderError,
} from "@domain/phone-provider"
import { baseLogger } from "@services/logger"
import { wrapAsyncFunctionsToRunInSpan } from "@services/tracing"

export const TwilioClient = (): IPhoneProviderService => {
  const client = twilio(getTwilioConfig().accountSid, getTwilioConfig().authToken)

  const sendText = async ({ body, to, logger }: SendTextArguments) => {
    const twilioPhoneNumber = getTwilioConfig().twilioPhoneNumber
    try {
      await client.messages.create({
        from: twilioPhoneNumber,
        to,
        body,
      })
    } catch (err) {
      logger.error({ err }, "impossible to send text")

      const invalidNumberMessages = ["not a valid phone number", "not a mobile number"]
      if (invalidNumberMessages.some((m) => err.message.includes(m))) {
        return new InvalidPhoneNumberPhoneProviderError(err)
      }

      if (err.message.includes("has not been enabled for the region")) {
        return new RestrictedRegionPhoneProviderError(err)
      }

      if (err.message.includes("unsubscribed recipient")) {
        return new UnsubscribedRecipientPhoneProviderError(err)
      }

      if (err.message.includes("timeout of") && err.message.includes("exceeded")) {
        return new PhoneProviderConnectionError(err)
      }

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

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.twilio",
    fns: { getCarrier, sendText },
  })
}
