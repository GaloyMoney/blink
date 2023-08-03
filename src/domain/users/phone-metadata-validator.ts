import {
  MissingPhoneMetadataError,
  InvalidPhoneMetadataTypeError,
  InvalidPhoneMetadataCountryError,
} from "@domain/errors"

export const PhoneMetadataValidator = ({
  denyCountries,
  allowCountries,
}: {
  denyCountries: string[]
  allowCountries: string[]
}): PhoneMetadataValidator => {
  const validate = (phoneMetadata?: PhoneMetadata): true | ValidationError => {
    if (!phoneMetadata || !phoneMetadata.carrier || !phoneMetadata.countryCode)
      return new MissingPhoneMetadataError()

    if (phoneMetadata.carrier.type === "voip") return new InvalidPhoneMetadataTypeError()

    const countryCode = phoneMetadata.countryCode.toUpperCase()
    const allowed = allowCountries.length === 0 || allowCountries.includes(countryCode)
    const denied = denyCountries.length > 0 && denyCountries.includes(countryCode)

    if (!allowed || denied) return new InvalidPhoneMetadataCountryError()

    return true
  }

  return { validate }
}
