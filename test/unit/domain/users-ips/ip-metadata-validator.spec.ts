import {
  InvalidIPMetadataASNError,
  InvalidIPMetadataCountryError,
  InvalidIPMetadataProxyError,
  MissingIPMetadataError,
} from "@domain/errors"
import { IPMetadataValidator } from "@domain/users-ips/ip-metadata-validator"

const defaultConfig = {
  denyIPCountries: [],
  allowIPCountries: [],
  denyASNs: [],
  allowASNs: [],
}

const defaultIpInfo: IPType = {
  ip: "89.187.173.251" as IpAddress,
  firstConnection: new Date(),
  lastConnection: new Date(),
  asn: "AS60068",
  provider: "ISP",
  country: "United States",
  isoCode: "US",
  region: "Florida",
  city: "Miami",
  proxy: false,
}

describe("IPMetadataValidator", () => {
  describe("validateForReward", () => {
    it("returns true for empty config", () => {
      const validator =
        IPMetadataValidator(defaultConfig).validateForReward(defaultIpInfo)
      expect(validator).toBe(true)
    })

    it("returns true for an allowed country", () => {
      const config = { ...defaultConfig, allowIPCountries: ["US"] }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpInfo)
      expect(validator).toBe(true)
    })

    it("returns true for a country not defined in deny-list", () => {
      const config = { ...defaultConfig, denyIPCountries: ["AF"] }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpInfo)
      expect(validator).toBe(true)
    })

    it("returns true for an allowed asn", () => {
      const config = { ...defaultConfig, allowASNs: ["AS60068"] }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpInfo)
      expect(validator).toBe(true)
    })

    it("returns true for an ASN not defined in deny-list", () => {
      const config = { ...defaultConfig, denyASNs: ["AS60067"] }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpInfo)
      expect(validator).toBe(true)
    })

    it("returns error for a country not defined in allow-list", () => {
      const config = { ...defaultConfig, allowIPCountries: ["US"] }
      const ipInfo = { ...defaultIpInfo, isoCode: "AF" }
      const validator = IPMetadataValidator(config).validateForReward(ipInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataCountryError)
    })

    it("returns error for an ASN not defined in allow-list", () => {
      const config = { ...defaultConfig, allowASNs: ["AS60068"] }
      const ipInfo = { ...defaultIpInfo, asn: "AS60067" }
      const validator = IPMetadataValidator(config).validateForReward(ipInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataASNError)
    })

    it("returns error for proxy/vpn", () => {
      const ipInfo = { ...defaultIpInfo, proxy: true }
      const validator = IPMetadataValidator(defaultConfig).validateForReward(ipInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataProxyError)
    })

    it("returns error for empty isoCode", () => {
      const ipInfo = { ...defaultIpInfo, isoCode: undefined }
      let validator = IPMetadataValidator(defaultConfig).validateForReward(ipInfo)
      expect(validator).toBeInstanceOf(MissingIPMetadataError)

      const ipInfo1 = { ...defaultIpInfo, isoCode: "" }
      validator = IPMetadataValidator(defaultConfig).validateForReward(ipInfo1)
      expect(validator).toBeInstanceOf(MissingIPMetadataError)
    })

    it("returns error for empty asn", () => {
      const ipInfo = { ...defaultIpInfo, asn: undefined }
      let validator = IPMetadataValidator(defaultConfig).validateForReward(ipInfo)
      expect(validator).toBeInstanceOf(MissingIPMetadataError)

      const ipInfo1 = { ...defaultIpInfo, asn: "" }
      validator = IPMetadataValidator(defaultConfig).validateForReward(ipInfo1)
      expect(validator).toBeInstanceOf(MissingIPMetadataError)
    })

    it("returns error for a denied country", () => {
      const config = { ...defaultConfig, denyIPCountries: ["US"] }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataCountryError)
    })

    it("returns error for a denied asn", () => {
      const config = { ...defaultConfig, denyASNs: ["AS60068"] }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataASNError)
    })

    it("returns error for a denied/allowed country", () => {
      const config = {
        ...defaultConfig,
        denyIPCountries: ["US"],
        allowIPCountries: ["US"],
      }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataCountryError)
    })

    it("returns error for a denied/allowed asn", () => {
      const config = {
        ...defaultConfig,
        denyASNs: ["AS60068"],
        allowASNs: ["AS60068"],
      }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataASNError)
    })

    it("returns error for a denied asn and allowed country", () => {
      const config = {
        ...defaultConfig,
        denyASNs: ["AS60068"],
        allowIPCountries: ["US"],
      }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataASNError)
    })

    it("returns error for a denied country and allowed asn", () => {
      const config = {
        ...defaultConfig,
        allowASNs: ["AS60068"],
        denyIPCountries: ["US"],
      }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataCountryError)
    })
  })
})
