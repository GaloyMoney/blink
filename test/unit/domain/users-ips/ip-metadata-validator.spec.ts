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

const defaultIpType: IPType = {
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

const defaultIpInfo: IPInfo = {
  asn: "AS60068",
  country: "United States",
  isoCode: "US",
  type: "type",
  status: "status",
  provider: "ISP",
  region: "Florida",
  city: "Miami",
  proxy: false,
}

describe("IPMetadataValidator", () => {
  describe("validateForReward", () => {
    it("returns true for empty config", () => {
      const validator =
        IPMetadataValidator(defaultConfig).validateForReward(defaultIpType)
      expect(validator).toBe(true)
    })

    it("returns true for an allowed country", () => {
      const config = { ...defaultConfig, allowIPCountries: ["US"] }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpType)
      expect(validator).toBe(true)
    })

    it("returns true for a country not defined in deny-list", () => {
      const config = { ...defaultConfig, denyIPCountries: ["AF"] }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpType)
      expect(validator).toBe(true)
    })

    it("returns true for an allowed asn", () => {
      const config = { ...defaultConfig, allowASNs: ["AS60068"] }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpType)
      expect(validator).toBe(true)
    })

    it("returns true for an ASN not defined in deny-list", () => {
      const config = { ...defaultConfig, denyASNs: ["AS60067"] }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpType)
      expect(validator).toBe(true)
    })

    it("returns error for a country not defined in allow-list", () => {
      const config = { ...defaultConfig, allowIPCountries: ["US"] }
      const ipInfo = { ...defaultIpType, isoCode: "AF" }
      const validator = IPMetadataValidator(config).validateForReward(ipInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataCountryError)
    })

    it("returns error for an ASN not defined in allow-list", () => {
      const config = { ...defaultConfig, allowASNs: ["AS60068"] }
      const ipInfo = { ...defaultIpType, asn: "AS60067" }
      const validator = IPMetadataValidator(config).validateForReward(ipInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataASNError)
    })

    it("returns error for proxy/vpn", () => {
      const ipInfo = { ...defaultIpType, proxy: true }
      const validator = IPMetadataValidator(defaultConfig).validateForReward(ipInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataProxyError)
    })

    it("returns error for empty isoCode", () => {
      const ipInfo = { ...defaultIpType, isoCode: undefined }
      let validator = IPMetadataValidator(defaultConfig).validateForReward(ipInfo)
      expect(validator).toBeInstanceOf(MissingIPMetadataError)

      const ipInfo1 = { ...defaultIpType, isoCode: "" }
      validator = IPMetadataValidator(defaultConfig).validateForReward(ipInfo1)
      expect(validator).toBeInstanceOf(MissingIPMetadataError)
    })

    it("returns error for empty asn", () => {
      const ipInfo = { ...defaultIpType, asn: undefined }
      let validator = IPMetadataValidator(defaultConfig).validateForReward(ipInfo)
      expect(validator).toBeInstanceOf(MissingIPMetadataError)

      const ipInfo1 = { ...defaultIpType, asn: "" }
      validator = IPMetadataValidator(defaultConfig).validateForReward(ipInfo1)
      expect(validator).toBeInstanceOf(MissingIPMetadataError)
    })

    it("returns error for a denied country", () => {
      const config = { ...defaultConfig, denyIPCountries: ["US"] }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpType)
      expect(validator).toBeInstanceOf(InvalidIPMetadataCountryError)
    })

    it("returns error for a denied asn", () => {
      const config = { ...defaultConfig, denyASNs: ["AS60068"] }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpType)
      expect(validator).toBeInstanceOf(InvalidIPMetadataASNError)
    })

    it("returns error for a denied/allowed country", () => {
      const config = {
        ...defaultConfig,
        denyIPCountries: ["US"],
        allowIPCountries: ["US"],
      }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpType)
      expect(validator).toBeInstanceOf(InvalidIPMetadataCountryError)
    })

    it("returns error for a denied/allowed asn", () => {
      const config = {
        ...defaultConfig,
        denyASNs: ["AS60068"],
        allowASNs: ["AS60068"],
      }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpType)
      expect(validator).toBeInstanceOf(InvalidIPMetadataASNError)
    })

    it("returns error for a denied asn and allowed country", () => {
      const config = {
        ...defaultConfig,
        denyASNs: ["AS60068"],
        allowIPCountries: ["US"],
      }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpType)
      expect(validator).toBeInstanceOf(InvalidIPMetadataASNError)
    })

    it("returns error for a denied country and allowed asn", () => {
      const config = {
        ...defaultConfig,
        allowASNs: ["AS60068"],
        denyIPCountries: ["US"],
      }
      const validator = IPMetadataValidator(config).validateForReward(defaultIpType)
      expect(validator).toBeInstanceOf(InvalidIPMetadataCountryError)
    })
  })

  describe("validateForNewAccount", () => {
    it("returns true for empty config", () => {
      const validator = IPMetadataValidator().validateForNewAccount(undefined)
      expect(validator).toBe(true)
    })

    it("returns true for valid config", () => {
      const validator = IPMetadataValidator().validateForNewAccount(defaultIpInfo)
      expect(validator).toBe(true)
    })

    it("returns error for proxy/vpn", () => {
      const ipInfo = { ...defaultIpInfo, proxy: true }
      const validator = IPMetadataValidator().validateForNewAccount(ipInfo)
      expect(validator).toBeInstanceOf(InvalidIPMetadataProxyError)
    })
  })
})
