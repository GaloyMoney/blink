import { yamlConfig } from "@config"
import {
  InvalidPhoneMetadataCountryError,
  InvalidPhoneMetadataTypeError,
  MissingPhoneMetadataError,
} from "@domain/errors"
import { PhoneMetadataValidator } from "@domain/users/phone-metadata-validator"

beforeEach(async () => {
  yamlConfig.rewards = {
    denyPhoneCountries: ["in"],
    allowPhoneCountries: ["sv", "US"],
  }
})

describe("PhoneMetadataValidator - validateForReward", () => {
  it("returns true for empty config", () => {
    yamlConfig.rewards = {
      denyPhoneCountries: [],
      allowPhoneCountries: [],
    }
    const validatorSV = PhoneMetadataValidator().validateForReward({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "IN",
    })
    expect(validatorSV).toBe(true)
  })

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

    yamlConfig.rewards = {
      denyPhoneCountries: ["AF"],
      allowPhoneCountries: [],
    }
    const validatorIN = PhoneMetadataValidator().validateForReward({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "IN",
    })
    expect(validatorIN).toBe(true)
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

    yamlConfig.rewards = {
      denyPhoneCountries: ["AF"],
      allowPhoneCountries: [],
    }
    const validatorAF = PhoneMetadataValidator().validateForReward({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "AF",
    })
    expect(validatorAF).toBeInstanceOf(InvalidPhoneMetadataCountryError)
  })

  it("returns error for allowed and denied country", () => {
    yamlConfig.rewards = {
      denyPhoneCountries: ["in"],
      allowPhoneCountries: ["in"],
    }
    const validator = PhoneMetadataValidator().validateForReward({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "IN",
    })

    // denyPhoneCountries config should have priority
    expect(validator).toBeInstanceOf(InvalidPhoneMetadataCountryError)
  })

  it("returns error with null metadata", () => {
    const validator = PhoneMetadataValidator().validateForReward(undefined)
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
      countryCode: "US",
    })
    expect(validator).toBeInstanceOf(InvalidPhoneMetadataTypeError)
  })
})
