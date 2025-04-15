import { getAccountsOnboardConfig } from "@/config"

import { PhoneMetadataAuthorizer } from "@/domain/users"
import {
  InvalidPhoneForOnboardingError,
  InvalidPhoneMetadataForOnboardingError,
} from "@/domain/users/errors"

import { addAttributesToCurrentSpan } from "@/services/tracing"
import { TwilioClient } from "@/services/twilio-service"

export const getPhoneMetadata = async ({ phone }: { phone: PhoneNumber }) => {
  const { phoneMetadataValidationSettings } = getAccountsOnboardConfig()

  const newPhoneMetadata = await TwilioClient().getCarrier(phone)
  if (newPhoneMetadata instanceof Error) {
    if (!phoneMetadataValidationSettings.enabled) {
      return undefined
    }

    return new InvalidPhoneMetadataForOnboardingError()
  }

  const phoneMetadata = newPhoneMetadata

  if (phoneMetadataValidationSettings.enabled) {
    const authorizedPhoneMetadata = PhoneMetadataAuthorizer(
      phoneMetadataValidationSettings,
    ).authorize(phoneMetadata)

    addAttributesToCurrentSpan({
      "login.phoneMetadata": JSON.stringify(phoneMetadata),
    })

    if (authorizedPhoneMetadata instanceof Error) {
      return new InvalidPhoneForOnboardingError(authorizedPhoneMetadata.name)
    }
  }

  return phoneMetadata
}
