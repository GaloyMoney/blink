import { CarrierType } from "@domain/phone-provider"

import {
  InvalidCarrierForPhoneMetadataError,
  InvalidCarrierTypeForPhoneMetadataError,
  InvalidCountryCodeForPhoneMetadataError,
} from "./errors"

export const PhoneMetadataValidator = (): PhoneMetadataValidator => {
  const validate = (
    rawPhoneMetadata: Record<string, string | Record<string, string>>,
  ): PhoneMetadata | ValidationError => {
    const { carrier, countryCode } = rawPhoneMetadata

    if (typeof carrier !== "object") {
      return new InvalidCarrierForPhoneMetadataError()
    }
    const {
      error_code,
      mobile_country_code,
      mobile_network_code,
      name,
      type: rawType,
    } = carrier

    const type = rawType as CarrierType
    if (!Object.values(CarrierType).includes(type)) {
      return new InvalidCarrierTypeForPhoneMetadataError()
    }

    if (typeof countryCode !== "string") {
      return new InvalidCountryCodeForPhoneMetadataError()
    }

    return {
      carrier: { error_code, mobile_country_code, mobile_network_code, name, type },
      countryCode,
    }
  }

  return { validate }
}
