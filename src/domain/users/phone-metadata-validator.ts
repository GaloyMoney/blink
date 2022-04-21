import {
  MissingPhoneMetadataError,
  InvalidPhoneMetadataTypeError,
  InvalidPhoneMetadataCountryError,
} from "@domain/errors"

export const PhoneMetadataValidator = ({
  denyPhoneCountries,
  allowPhoneCountries,
}: {
  denyPhoneCountries: string[]
  allowPhoneCountries: string[]
}): PhoneMetadataValidator => {
  const validateForReward = (phoneMetadata?: PhoneMetadata): true | ValidationError => {
    if (!phoneMetadata || !phoneMetadata.carrier || !phoneMetadata.countryCode)
      return new MissingPhoneMetadataError()

    if (phoneMetadata.carrier.type === "voip") return new InvalidPhoneMetadataTypeError()

    const countryCode = phoneMetadata.countryCode.toUpperCase()
    const allowed =
      allowPhoneCountries.length <= 0 || allowPhoneCountries.includes(countryCode)
    const denied =
      denyPhoneCountries.length > 0 && denyPhoneCountries.includes(countryCode)

    if (!allowed || denied) return new InvalidPhoneMetadataCountryError()

    return true
  }

  return {
    validateForReward,
  }
}
