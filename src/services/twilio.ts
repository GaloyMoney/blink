import twilio from "twilio"

import { getTwilioConfig } from "@config"
import {
  PhoneCodeInvalidError,
  ExpiredOrNonExistentPhoneNumberError,
  InvalidPhoneNumberPhoneProviderError,
  PhoneProviderConnectionError,
  RestrictedRegionPhoneProviderError,
  UnknownPhoneProviderServiceError,
  UnsubscribedRecipientPhoneProviderError,
} from "@domain/phone-provider"
import { baseLogger } from "@services/logger"

import { VerificationCheckInstance } from "twilio/lib/rest/verify/v2/service/verificationCheck"

import { wrapAsyncFunctionsToRunInSpan } from "./tracing"

export const TwilioClient = (): IPhoneProviderService => {
  const { accountSid, authToken, verifyService } = getTwilioConfig()

  const client = twilio(accountSid, authToken)
  const verify = client.verify.v2.services(verifyService)

  const initiateVerify = async ({
    to,
    channel,
  }: {
    to: PhoneNumber
    channel: ChannelType
  }): Promise<true | PhoneProviderServiceError> => {
    try {
      await verify.verifications.create({ to, channel })
    } catch (err) {
      baseLogger.error({ err }, "impossible to send text")
      const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(err.message)

      switch (true) {
        case match(KnownTwilioErrorMessages.InvalidPhoneNumber):
        case match(KnownTwilioErrorMessages.InvalidMobileNumber):
          return new InvalidPhoneNumberPhoneProviderError(err.message || err)

        case match(KnownTwilioErrorMessages.RestrictedRegion):
        case match(KnownTwilioErrorMessages.BlockedRegion):
          return new RestrictedRegionPhoneProviderError(err.message || err)

        case match(KnownTwilioErrorMessages.UnsubscribedRecipient):
          return new UnsubscribedRecipientPhoneProviderError(err.message || err)

        case match(KnownTwilioErrorMessages.BadPhoneProviderConnection):
          return new PhoneProviderConnectionError(err.message || err)

        default:
          return new UnknownPhoneProviderServiceError(err.message || err)
      }
    }

    return true
  }

  const validateVerify = async ({
    to,
    code,
  }: {
    to: PhoneNumber
    code: PhoneCode
  }): Promise<true | PhoneProviderServiceError> => {
    let verification: VerificationCheckInstance

    try {
      verification = await verify.verificationChecks.create({ to, code })
    } catch (err) {
      baseLogger.error({ err }, "impossible to verify phone and code")

      if (err.message.includes("Invalid parameter `To`")) {
        return new InvalidPhoneNumberPhoneProviderError(err.message || err)
      }

      if (err.message.includes("timeout of") && err.message.includes("exceeded")) {
        return new PhoneProviderConnectionError(err.message || err)
      }

      if (err.status === 404) {
        return new ExpiredOrNonExistentPhoneNumberError(err.message || err)
      }

      return new UnknownPhoneProviderServiceError(err.message || err)
    }

    if (verification.status !== "approved") {
      return new PhoneCodeInvalidError()
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
      return new UnknownPhoneProviderServiceError(err.message || err)
    }
  }

  return wrapAsyncFunctionsToRunInSpan({
    namespace: "services.twilio",
    fns: { getCarrier, validateVerify, initiateVerify },
  })
}

export const KnownTwilioErrorMessages: { [key: string]: RegExp } = {
  InvalidPhoneNumber: /not a valid phone number/,
  InvalidMobileNumber: /not a mobile number/,
  RestrictedRegion: /has not been enabled for the region/,
  UnsubscribedRecipient: /unsubscribed recipient/,
  BadPhoneProviderConnection: /timeout of.*exceeded/,
  BlockedRegion:
    /The destination phone number has been blocked by Verify Geo-Permissions. .* is blocked for sms channel for all services/,
} as const
