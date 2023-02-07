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
  PhoneProviderRateLimitExceededError,
  RestrictedRecipientPhoneNumberError,
} from "@domain/phone-provider"
import { baseLogger } from "@services/logger"

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
      return handleCommonErrors(err)
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
    try {
      const verification = await verify.verificationChecks.create({ to, code })
      if (verification.status !== "approved") {
        return new PhoneCodeInvalidError()
      }

      return true
    } catch (err) {
      baseLogger.error({ err }, "impossible to verify phone and code")

      switch (true) {
        case err.status === 404:
          return new ExpiredOrNonExistentPhoneNumberError(err.message || err)

        default:
          return handleCommonErrors(err)
      }
    }
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

const handleCommonErrors = (err: Error | string) => {
  const errMsg = typeof err === "string" ? err : err.message

  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errMsg)

  switch (true) {
    case match(KnownTwilioErrorMessages.InvalidPhoneNumber):
    case match(KnownTwilioErrorMessages.InvalidMobileNumber):
    case match(KnownTwilioErrorMessages.InvalidPhoneNumberParameter):
      return new InvalidPhoneNumberPhoneProviderError(errMsg)

    case match(KnownTwilioErrorMessages.RestrictedRegion):
    case match(KnownTwilioErrorMessages.CountryNeedsVetting):
    case match(KnownTwilioErrorMessages.BlockedRegion):
      return new RestrictedRegionPhoneProviderError(errMsg)

    case match(KnownTwilioErrorMessages.UnsubscribedRecipient):
      return new UnsubscribedRecipientPhoneProviderError(errMsg)

    case match(KnownTwilioErrorMessages.BadPhoneProviderConnection):
      return new PhoneProviderConnectionError(errMsg)

    case match(KnownTwilioErrorMessages.RateLimitsExceeded):
    case match(KnownTwilioErrorMessages.TooManyConcurrentRequests):
      return new PhoneProviderRateLimitExceededError(errMsg)

    case match(KnownTwilioErrorMessages.FraudulentActivityBlock):
      return new RestrictedRecipientPhoneNumberError(errMsg)

    default:
      return new UnknownPhoneProviderServiceError(errMsg)
  }
}
export const KnownTwilioErrorMessages = {
  InvalidPhoneNumber: /not a valid phone number/,
  InvalidMobileNumber: /not a mobile number/,
  InvalidPhoneNumberParameter: /Invalid parameter `To`/,
  RestrictedRegion: /has not been enabled for the region/,
  CountryNeedsVetting: /require use case vetting/,
  UnsubscribedRecipient: /unsubscribed recipient/,
  BadPhoneProviderConnection: /timeout of.*exceeded/,
  BlockedRegion:
    /The destination phone number has been blocked by Verify Geo-Permissions. .* is blocked for sms channel for all services/,
  RateLimitsExceeded: /Max.*attempts reached/,
  TooManyConcurrentRequests: /Too many concurrent requests/,
  FraudulentActivityBlock:
    /The destination phone number has been temporarily blocked by Twilio due to fraudulent activities/,
} as const
