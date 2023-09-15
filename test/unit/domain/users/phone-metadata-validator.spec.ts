import {
  InvalidCarrierForPhoneMetadataError,
  InvalidCarrierTypeForPhoneMetadataError,
  InvalidCountryCodeForPhoneMetadataError,
} from "@domain/users/errors"
import { PhoneMetadataValidator } from "@domain/users"

describe("PhoneMetadataValidator", () => {
  it("returns valid PhoneMetadata object", async () => {
    const validRawPhoneMetadata = { carrier: { type: "mobile" }, countryCode: "US" }

    const phoneMetadata = PhoneMetadataValidator().validate(validRawPhoneMetadata)
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

  it("returns error for invalid country code type", async () => {
    // Country code as object
    {
      const invalidRawPhoneMetadata = {
        carrier: { type: "mobile" },
        countryCode: { name: "" },
      }
      const phoneMetadata = PhoneMetadataValidator().validate(invalidRawPhoneMetadata)
      expect(phoneMetadata).toBeInstanceOf(InvalidCountryCodeForPhoneMetadataError)
    }

    // Missing country code
    {
      const invalidRawPhoneMetadata = {
        carrier: { type: "mobile" },
      }
      const phoneMetadata = PhoneMetadataValidator().validate(invalidRawPhoneMetadata)
      expect(phoneMetadata).toBeInstanceOf(InvalidCountryCodeForPhoneMetadataError)
    }
  })
})
