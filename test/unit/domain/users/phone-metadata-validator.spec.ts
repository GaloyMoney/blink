import { getRewardsConfig, yamlConfig } from "@config"
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
    denyIPCountries: [],
    allowIPCountries: [],
    denyASNs: [],
    allowASNs: [],
  }
})

describe("PhoneMetadataValidator - validate", () => {
  it("returns true for empty config", () => {
    const config = {
      denyPhoneCountries: [],
      allowPhoneCountries: [],
    }
    const validatorSV = PhoneMetadataValidator(config).validate({
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
    const validatorSV = PhoneMetadataValidator(getRewardsConfig()).validate({
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

    const validatorSV1 = PhoneMetadataValidator(getRewardsConfig()).validate({
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

    const validatorUS = PhoneMetadataValidator(getRewardsConfig()).validate({
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

    const config = {
      denyPhoneCountries: ["AF"],
      allowPhoneCountries: [],
    }
    const validatorIN = PhoneMetadataValidator(config).validate({
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
    const validator = PhoneMetadataValidator(getRewardsConfig()).validate({
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

    const config = {
      denyPhoneCountries: ["AF"],
      allowPhoneCountries: [],
    }
    const validatorAF = PhoneMetadataValidator(config).validate({
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
    const config = {
      denyPhoneCountries: ["in"],
      allowPhoneCountries: ["in"],
    }
    const validator = PhoneMetadataValidator(config).validate({
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

  it("returns error with undefined metadata", () => {
    const validator = PhoneMetadataValidator(getRewardsConfig()).validate(undefined)
    expect(validator).toBeInstanceOf(MissingPhoneMetadataError)
  })

  it("returns error with voip type", () => {
    const validator = PhoneMetadataValidator(getRewardsConfig()).validate({
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
