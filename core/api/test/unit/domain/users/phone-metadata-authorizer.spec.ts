import { getQuizzesConfig, yamlConfig } from "@/config"
import {
  PhoneCountryNotAllowedError,
  PhoneCarrierTypeNotAllowedError,
  ExpectedPhoneMetadataMissingError,
} from "@/domain/users/errors"
import { PhoneMetadataAuthorizer } from "@/domain/users"

beforeEach(async () => {
  yamlConfig.quizzes = {
    denyPhoneCountries: ["in"],
    allowPhoneCountries: ["sv", "US"],
    denyIPCountries: [],
    allowIPCountries: [],
    denyASNs: [],
    allowASNs: [],
    enableIpProxyCheck: true,
  }
})

const getPhoneMetadataQuizzesSettings = () =>
  getQuizzesConfig().phoneMetadataValidationSettings

describe("PhoneMetadataAuthorizer - validate", () => {
  it("returns true for empty config", () => {
    const config = {
      denyCountries: [],
      allowCountries: [],
    }
    const authorizersSV = PhoneMetadataAuthorizer(config).authorize({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "IN",
    })
    expect(authorizersSV).toBe(true)
  })

  it("returns true for a valid country", () => {
    const authorizersSV = PhoneMetadataAuthorizer(
      getPhoneMetadataQuizzesSettings(),
    ).authorize({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "SV",
    })
    expect(authorizersSV).toBe(true)

    const authorizersSV1 = PhoneMetadataAuthorizer(
      getPhoneMetadataQuizzesSettings(),
    ).authorize({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "sv",
    })
    expect(authorizersSV1).toBe(true)

    const validatorUS = PhoneMetadataAuthorizer(
      getPhoneMetadataQuizzesSettings(),
    ).authorize({
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
      denyCountries: ["AF"],
      allowCountries: [],
    }
    const validatorIN = PhoneMetadataAuthorizer(config).authorize({
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
    const validator = PhoneMetadataAuthorizer(
      getPhoneMetadataQuizzesSettings(),
    ).authorize({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "CO",
    })
    expect(validator).toBeInstanceOf(PhoneCountryNotAllowedError)

    const config = {
      denyCountries: ["AF"],
      allowCountries: [],
    }
    const validatorAF = PhoneMetadataAuthorizer(config).authorize({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "mobile",
      },
      countryCode: "AF",
    })
    expect(validatorAF).toBeInstanceOf(PhoneCountryNotAllowedError)
  })

  it("returns error for allowed and denied country", () => {
    const config = {
      denyCountries: ["in"],
      allowCountries: ["in"],
    }
    const validator = PhoneMetadataAuthorizer(config).authorize({
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
    expect(validator).toBeInstanceOf(PhoneCountryNotAllowedError)
  })

  it("returns error with undefined metadata", () => {
    const validator = PhoneMetadataAuthorizer(
      getPhoneMetadataQuizzesSettings(),
    ).authorize(undefined)
    expect(validator).toBeInstanceOf(ExpectedPhoneMetadataMissingError)
  })

  it("returns error with voip type", () => {
    const validator = PhoneMetadataAuthorizer(
      getPhoneMetadataQuizzesSettings(),
    ).authorize({
      carrier: {
        error_code: "",
        mobile_country_code: "",
        mobile_network_code: "",
        name: "",
        type: "voip",
      },
      countryCode: "US",
    })
    expect(validator).toBeInstanceOf(PhoneCarrierTypeNotAllowedError)
  })
})
