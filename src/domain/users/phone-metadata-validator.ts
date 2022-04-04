import { getRewardsConfig } from "@config"
import {
  MissingPhoneMetadataError,
  InvalidPhoneMetadataTypeError,
  InvalidPhoneMetadataCountryError,
} from "@domain/errors"

const { enabledCountries } = getRewardsConfig()
export const PhoneMetadataValidator = (): PhoneMetadataValidator => {
  const validateForReward = (phoneMetadata?: PhoneMetadata): true | ApplicationError => {
    if (!phoneMetadata || !phoneMetadata.carrier) return new MissingPhoneMetadataError()

    if (phoneMetadata.carrier.type === "voip") return new InvalidPhoneMetadataTypeError()

    if (
      enabledCountries.length > 0 &&
      phoneMetadata.countryCode &&
      !enabledCountries.includes(phoneMetadata.countryCode.toUpperCase())
    )
      return new InvalidPhoneMetadataCountryError()

    return true
  }

  return {
    validateForReward,
  }
}
