import {
  PhoneCountryNotAllowedError,
  PhoneMetadataCarrierTypeNotAllowedError,
  ExpectedPhoneMetadataMissingError,
} from "./errors"

export const PhoneMetadataAuthorizer = ({
  denyCountries,
  allowCountries,
}: {
  denyCountries: string[]
  allowCountries: string[]
}): PhoneMetadataAuthorizer => {
  const authorize = (
    phoneMetadata: PhoneMetadata | undefined,
  ): true | AuthorizationError => {
    if (phoneMetadata === undefined) return new ExpectedPhoneMetadataMissingError()

    if (phoneMetadata.carrier.type === "voip")
      return new PhoneMetadataCarrierTypeNotAllowedError()

    const countryCode = phoneMetadata.countryCode.toUpperCase()
    const allowed = allowCountries.length === 0 || allowCountries.includes(countryCode)
    const denied = denyCountries.length > 0 && denyCountries.includes(countryCode)

    if (!allowed || denied) return new PhoneCountryNotAllowedError()

    return true
  }

  return { authorize }
}
