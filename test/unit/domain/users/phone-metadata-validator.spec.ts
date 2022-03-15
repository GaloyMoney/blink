import {
  InvalidPhoneMetadataCountryError,
  InvalidPhoneMetadataTypeError,
  MissingPhoneMetadataError,
} from "@domain/errors"
import { PhoneMetadataValidator } from "@domain/users/phone-metadata-validator"

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
  config.yamlConfig.rewards = {
    whitelistedCountries: ["sv", "US"],
  }
  return config
})

afterAll(async () => {
  jest.restoreAllMocks()
})

describe("PhoneMetadataValidator - validateForReward", () => {
  it("returns true for a valid country", () => {
    const validatorSV = PhoneMetadataValidator().validateForReward({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "SV",
    })
    expect(validatorSV).toBe(true)

    const validatorSV1 = PhoneMetadataValidator().validateForReward({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "sv",
    })
    expect(validatorSV1).toBe(true)

    const validatorUS = PhoneMetadataValidator().validateForReward({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "US",
    })
    expect(validatorUS).toBe(true)
  })

  it("returns error for invalid country", () => {
    const validator = PhoneMetadataValidator().validateForReward({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "CO",
    })
    expect(validator).toBeInstanceOf(InvalidPhoneMetadataCountryError)
  })

  it("returns error with null metadata", () => {
    const validator = PhoneMetadataValidator().validateForReward(null)
    expect(validator).toBeInstanceOf(MissingPhoneMetadataError)
  })

  it("returns error with voip type", () => {
    const validator = PhoneMetadataValidator().validateForReward({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "voip",
      },
      countryCode: "",
    })
    expect(validator).toBeInstanceOf(InvalidPhoneMetadataTypeError)
  })
})
