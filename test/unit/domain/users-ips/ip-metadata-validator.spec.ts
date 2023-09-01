import {
  InvalidIPMetadataASNError,
  InvalidIPMetadataCountryError,
  InvalidIPMetadataProxyError,
  MissingIPMetadataError,
} from "@domain/errors"
import { IPMetadataValidator } from "@domain/accounts-ips/ip-metadata-validator"

const defaultConfig = {
  denyCountries: [],
  allowCountries: [],
  denyASNs: [],
  allowASNs: [],
}

const defaultIpInfo: IPType = {
  asn: "AS60068",
  provider: "ISP",
  country: "United States",
  isoCode: "US",
  region: "Florida",
  city: "Miami",
  proxy: false,
}

describe("IPMetadataValidator", () => {
  describe("validate", () => {
    it("returns true for empty config", () => {
      const validator = IPMetadataValidator(defaultConfig).validate(defaultIpInfo)
      expect(validator).toBe(true)
    })

    it("returns true for an allowed country", () => {
      const config = { ...defaultConfig, allowCountries: ["US"] }
      const validator = IPMetadataValidator(config).validate(defaultIpInfo)
      expect(validator).toBe(true)
    })

    it("returns true for a country not defined in deny-list", () => {
      const config = { ...defaultConfig, denyCountries: ["AF"] }
      const validator = IPMetadataValidator(config).validate(defaultIpInfo)
      expect(validator).toBe(true)
    })

    it("returns true for an allowed asn", () => {
      const config = { ...defaultConfig, allowASNs: ["AS60068"] }
      const validator = IPMetadataValidator(config).validate(defaultIpInfo)
      expect(validator).toBe(true)
    })

    it("returns true for an ASN not defined in deny-list", () => {
      const config = { ...defaultConfig, denyASNs: ["AS60067"] }
      const validator = IPMetadataValidator(config).validate(defaultIpInfo)
      expect(validator).toBe(true)
    })

    it("returns error for a country not defined in allow-list", () => {
      const config = { ...defaultConfig, allowCountries: ["US"] }
      const ipInfo = { ...defaultIpInfo, isoCode: "AF" }
      const validator = IPMetadataValidator(config).validate(ipInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataCountryError)
    })

    it("returns error for an ASN not defined in allow-list", () => {
      const config = { ...defaultConfig, allowASNs: ["AS60068"] }
      const ipInfo = { ...defaultIpInfo, asn: "AS60067" }
      const validator = IPMetadataValidator(config).validate(ipInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataASNError)
    })

    it("returns error for proxy/vpn", () => {
      const ipInfo = { ...defaultIpInfo, proxy: true }
      const validator = IPMetadataValidator(defaultConfig).validate(ipInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataProxyError)
    })

    it("returns error for empty isoCode", () => {
      const ipInfo = { ...defaultIpInfo, isoCode: undefined }
      let validator = IPMetadataValidator(defaultConfig).validate(ipInfo)
      expect(validator).toBeInstanceOf(MissingIPMetadataError)

      const ipInfo1 = { ...defaultIpInfo, isoCode: "" }
      validator = IPMetadataValidator(defaultConfig).validate(ipInfo1)
      expect(validator).toBeInstanceOf(MissingIPMetadataError)
    })

    it("returns error for empty asn", () => {
      const ipInfo = { ...defaultIpInfo, asn: undefined }
      let validator = IPMetadataValidator(defaultConfig).validate(ipInfo)
      expect(validator).toBeInstanceOf(MissingIPMetadataError)

      const ipInfo1 = { ...defaultIpInfo, asn: "" }
      validator = IPMetadataValidator(defaultConfig).validate(ipInfo1)
      expect(validator).toBeInstanceOf(MissingIPMetadataError)
    })

    it("returns error for a denied country", () => {
      const config = { ...defaultConfig, denyCountries: ["US"] }
      const validator = IPMetadataValidator(config).validate(defaultIpInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataCountryError)
    })

    it("returns error for a denied asn", () => {
      const config = { ...defaultConfig, denyASNs: ["AS60068"] }
      const validator = IPMetadataValidator(config).validate(defaultIpInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataASNError)
    })

    it("returns error for a denied/allowed country", () => {
      const config = {
        ...defaultConfig,
        denyCountries: ["US"],
        allowCountries: ["US"],
      }
      const validator = IPMetadataValidator(config).validate(defaultIpInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataCountryError)
    })

    it("returns error for a denied/allowed asn", () => {
      const config = {
        ...defaultConfig,
        denyASNs: ["AS60068"],
        allowASNs: ["AS60068"],
      }
      const validator = IPMetadataValidator(config).validate(defaultIpInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataASNError)
    })

    it("returns error for a denied asn and allowed country", () => {
      const config = {
        ...defaultConfig,
        denyASNs: ["AS60068"],
        allowCountries: ["US"],
      }
      const validator = IPMetadataValidator(config).validate(defaultIpInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataASNError)
    })

    it("returns error for a denied country and allowed asn", () => {
      const config = {
        ...defaultConfig,
        allowASNs: ["AS60068"],
        denyCountries: ["US"],
      }
      const validator = IPMetadataValidator(config).validate(defaultIpInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataCountryError)
    })
  })
})
