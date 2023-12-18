import {
  InvalidCarrierForPhoneMetadataError,
  InvalidCarrierTypeForPhoneMetadataError,
  InvalidCountryCodeForPhoneMetadataError,
  InvalidErrorCodeForPhoneMetadataError,
} from "@/domain/users/errors"
import { PhoneMetadataValidator } from "@/domain/users"

describe("PhoneMetadataValidator", () => {
  it("returns valid PhoneMetadata object", async () => {
    const validRawPhoneMetadata = {
      carrier: { type: "mobile", error_code: "", mobile_country_code: "" },
      countryCode: "US",
    }

    const phoneMetadata = PhoneMetadataValidator().validate(validRawPhoneMetadata)
    expect(phoneMetadata).not.toBeInstanceOf(Error)
  })

  it("returns valid for incomplete object", async () => {
    // sometimes we get incomplete information from twilio
    // ie: https://www.twilio.com/docs/api/errors/60601
    const partialPhoneMetadata = {
      carrier: {
        name: null,
        type: null,
        error_code: "60601",
        mobile_country_code: "302",
        mobile_network_code: null,
      },
      countryCode: "CA",
    }

    const phoneMetadata = PhoneMetadataValidator().validate(partialPhoneMetadata)
    expect(phoneMetadata).not.toBeInstanceOf(Error)
  })

  it("returns error for invalid carrier object", async () => {
    const invalidRawPhoneMetadata = { carrier: "mobile", countryCode: "US" }

    const phoneMetadata = PhoneMetadataValidator().validate(invalidRawPhoneMetadata)
    expect(phoneMetadata).toBeInstanceOf(InvalidCarrierForPhoneMetadataError)
  })

  it("returns error for invalid carrier type", async () => {
    const invalidRawPhoneMetadata = { carrier: { type: "invalid" }, countryCode: "US" }

    const phoneMetadata = PhoneMetadataValidator().validate(invalidRawPhoneMetadata)
    expect(phoneMetadata).toBeInstanceOf(InvalidCarrierTypeForPhoneMetadataError)
  })

  it("returns error for invalid error code type", async () => {
    // Missing
    {
      const invalidRawPhoneMetadata = {
        carrier: { type: "mobile" },
        countryCode: "US",
      }

      const phoneMetadata = PhoneMetadataValidator().validate(invalidRawPhoneMetadata)
      expect(phoneMetadata).toBeInstanceOf(InvalidErrorCodeForPhoneMetadataError)
    }
    // Incorrect type
    {
      const invalidRawPhoneMetadata = {
        carrier: { type: "mobile", error_code: null },
        countryCode: "US",
      }

      const phoneMetadata = PhoneMetadataValidator().validate(invalidRawPhoneMetadata)
      expect(phoneMetadata).toBeInstanceOf(InvalidErrorCodeForPhoneMetadataError)
    }
  })

  it("returns error for invalid country code type", async () => {
    // Country code as object
    {
      const invalidRawPhoneMetadata = {
        carrier: { type: "mobile", error_code: "", mobile_country_code: "" },
        countryCode: { name: "" },
      }
      const phoneMetadata = PhoneMetadataValidator().validate(invalidRawPhoneMetadata)
      expect(phoneMetadata).toBeInstanceOf(InvalidCountryCodeForPhoneMetadataError)
    }

    // Missing country code
    {
      const invalidRawPhoneMetadata = {
        carrier: { type: "mobile", error_code: "", mobile_country_code: "" },
      }
      const phoneMetadata = PhoneMetadataValidator().validate(invalidRawPhoneMetadata)
      expect(phoneMetadata).toBeInstanceOf(InvalidCountryCodeForPhoneMetadataError)
    }
  })
})
