import twilio from "twilio"

import { getTwilioConfig } from "@config"
import {
  ExpiredOrNonExistentPhoneNumber,
  InvalidPhoneNumberPhoneProviderError,
  PhoneProviderConnectionError,
  RestrictedRegionPhoneProviderError,
  UnknownPhoneProviderServiceError,
  UnsubscribedRecipientPhoneProviderError,
} from "@domain/phone-provider"
import { baseLogger } from "@services/logger"

import { VerificationInstance } from "twilio/lib/rest/verify/v2/service/verification"
import { VerificationCheckInstance } from "twilio/lib/rest/verify/v2/service/verificationCheck"

import { CodeInvalidError } from "@domain/authentication/errors"

import { wrapAsyncFunctionsToRunInSpan } from "./tracing"

export const TwilioClient = (): IPhoneProviderService => {
  const client = twilio(getTwilioConfig().accountSid, getTwilioConfig().authToken)
  const verify = client.verify.v2.services(getTwilioConfig().verifyService)

  const initiateVerify = async (to: PhoneNumber) => {
    let verification: VerificationInstance
    console.log("initiateVerify")

    try {
      verification = await verify.verifications.create({ to, channel: "sms" })
    } catch (err) {
      baseLogger.error({ err }, "impossible to send text")

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

      console.log({ err })
      return new UnknownPhoneProviderServiceError(err)
    }

    verification
    return true
  }

  const validateVerify = async ({
    to,
    code,
  }: {
    to: PhoneNumber
    code: PhoneCode
  }): Promise<true | UnknownPhoneProviderServiceError | CodeInvalidError> => {
    let verification: VerificationCheckInstance

    console.log("validateVerify")

    try {
      verification = await verify.verificationChecks.create({ to, code })
    } catch (err) {
      if (err.message.includes("Invalid parameter `To`")) {
        return new InvalidPhoneNumberPhoneProviderError(err)
      }

      if (err.status === 404) {
        return new ExpiredOrNonExistentPhoneNumber(err)
      }

      console.log({ err }, "verify123")
      return new UnknownPhoneProviderServiceError(err)
    }

    if (verification.status !== "approved") {
      return new CodeInvalidError()
    }

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

      const phoneMetadata: PhoneMetadata = {
        carrier: {
          error_code: result.carrier.error_code,
          mobile_country_code: result.carrier.mobile_country_code,
          mobile_network_code: result.carrier.mobile_network_code,
          name: result.carrier.name,
          type: result.carrier.type,
        },
        countryCode: result.countryCode,
      }

      return phoneMetadata
    } catch (err) {
      return new UnknownPhoneProviderServiceError(err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.twilio",
    fns: { getCarrier, validateVerify, initiateVerify },
  })
}
