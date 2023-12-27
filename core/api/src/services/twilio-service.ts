import twilio from "twilio"
import { isAxiosError } from "axios"
import disposablePhoneList from "@ip1sms/disposable-phone-numbers"

import { wrapAsyncFunctionsToRunInSpan } from "./tracing"

import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_VERIFY_SERVICE_ID,
  UNSECURE_DEFAULT_LOGIN_CODE,
  getTestAccounts,
} from "@/config"
import {
  ExpiredOrNonExistentPhoneNumberError,
  InvalidOrApprovedVerificationError,
  InvalidPhoneNumberPhoneProviderError,
  InvalidTypePhoneProviderError,
  MissingTypePhoneProviderError,
  PhoneCodeInvalidError,
  PhoneProviderConnectionError,
  PhoneProviderRateLimitExceededError,
  PhoneProviderUnavailableError,
  RestrictedRecipientPhoneNumberError,
  RestrictedRegionPhoneProviderError,
  UnknownPhoneProviderServiceError,
  UnsubscribedRecipientPhoneProviderError,
} from "@/domain/phone-provider"
import { baseLogger } from "@/services/logger"

import { TestAccountsChecker } from "@/domain/accounts/test-accounts-checker"
import { NotImplementedError } from "@/domain/errors"
import { parseErrorMessageFromUnknown } from "@/domain/shared"

export const TWILIO_ACCOUNT_TEST = "AC_twilio_id"

export const TwilioClient = (): IPhoneProviderService => {
  const accountSid = TWILIO_ACCOUNT_SID
  const authToken = TWILIO_AUTH_TOKEN
  const verifyService = TWILIO_VERIFY_SERVICE_ID

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
      if (isDisposablePhoneNumber(to)) {
        return new InvalidTypePhoneProviderError("disposable")
      }

      const lookup = await client.lookups.v2.phoneNumbers(to).fetch({
        fields: "line_type_intelligence",
      })
      // https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence#type-property-values
      if (!lookup.lineTypeIntelligence) {
        return new MissingTypePhoneProviderError()
      }
      if (lookup.lineTypeIntelligence.type === "nonFixedVoip") {
        return new InvalidTypePhoneProviderError("nonFixedVoip")
      }

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
      if (isAxiosError(err) && err.status === 404) {
        return new ExpiredOrNonExistentPhoneNumberError(err.message)
      }

      return handleCommonErrors(err)
    }
  }

  const getCarrier = async (phone: PhoneNumber) => {
    try {
      const result = await client.lookups.v1
        .phoneNumbers(phone)
        .fetch({ type: ["carrier"] })
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
          error_code: `${result.carrier.error_code}`,
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

const handleCommonErrors = (err: Error | string | unknown) => {
  const errMsg = parseErrorMessageFromUnknown(err)

  const match = (knownErrDetail: RegExp): boolean => knownErrDetail.test(errMsg)

  switch (true) {
    case match(KnownTwilioErrorMessages.InvalidPhoneNumber):
    case match(KnownTwilioErrorMessages.InvalidMobileNumber):
    case match(KnownTwilioErrorMessages.InvalidPhoneNumberParameter):
      return new InvalidPhoneNumberPhoneProviderError(errMsg)

    case match(KnownTwilioErrorMessages.InvalidCodeParameter):
      return new PhoneCodeInvalidError(errMsg)

    case match(KnownTwilioErrorMessages.RestrictedRegion):
    case match(KnownTwilioErrorMessages.CountryNeedsVetting):
    case match(KnownTwilioErrorMessages.BlockedRegion):
      return new RestrictedRegionPhoneProviderError(errMsg)

    case match(KnownTwilioErrorMessages.UnsubscribedRecipient):
      return new UnsubscribedRecipientPhoneProviderError(errMsg)

    case match(KnownTwilioErrorMessages.BadPhoneProviderConnection):
      return new PhoneProviderConnectionError(errMsg)

    case match(KnownTwilioErrorMessages.ServiceUnavailable):
      return new PhoneProviderUnavailableError(errMsg)

    case match(KnownTwilioErrorMessages.RateLimitsExceeded):
    case match(KnownTwilioErrorMessages.TooManyConcurrentRequests):
      return new PhoneProviderRateLimitExceededError(errMsg)

    case match(KnownTwilioErrorMessages.FraudulentActivityBlock):
      return new RestrictedRecipientPhoneNumberError(errMsg)

    case match(KnownTwilioErrorMessages.InvalidOrApprovedVerification):
      return new InvalidOrApprovedVerificationError(errMsg)

    default:
      return new UnknownPhoneProviderServiceError(errMsg)
  }
}
export const KnownTwilioErrorMessages = {
  InvalidPhoneNumber: /not a valid phone number/,
  InvalidMobileNumber: /not a .*mobile number/,
  InvalidPhoneNumberParameter: /Invalid parameter `To`/,
  InvalidCodeParameter: /Invalid parameter: Code/,
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
  ServiceUnavailable: /Service is unavailable. Please try again/,
  InvalidOrApprovedVerification:
    /The requested resource \/Services\/(.*?)\/VerificationCheck was not found/,
} as const

export const isPhoneCodeValid = async ({
  code,
  phone,
}: {
  phone: PhoneNumber
  code: PhoneCode
}) => {
  if (code === UNSECURE_DEFAULT_LOGIN_CODE) {
    return true
  }

  const testAccounts = getTestAccounts()
  if (TestAccountsChecker(testAccounts).isPhoneTest(phone)) {
    const validTestCode = TestAccountsChecker(testAccounts).isPhoneTestAndCodeValid({
      code,
      phone,
    })
    if (!validTestCode) {
      return new PhoneCodeInvalidError()
    }
    return true
  }

  // we can't mock this function properly because in the e2e test,
  // the server is been launched as a sub process,
  // so it's not been mocked by jest
  if (TWILIO_ACCOUNT_SID === TWILIO_ACCOUNT_TEST) {
    return new NotImplementedError("use test account for local dev and tests")
  }

  return TwilioClient().validateVerify({ to: phone, code })
}

export const isDisposablePhoneNumber = (phone: PhoneNumber) => {
  const phoneNumber = phone.replace(/[^0-9]/, "")
  return phoneNumber in disposablePhoneList
}
