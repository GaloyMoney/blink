import {
  UnauthorizedIPMetadataASNError,
  MissingIPMetadataError,
  UnauthorizedIPMetadataCountryError,
  UnauthorizedIPMetadataProxyError,
} from "@/domain/errors"
import { IPMetadataAuthorizer } from "@/domain/accounts-ips/ip-metadata-authorizer"

const defaultConfig = {
  denyCountries: [],
  allowCountries: [],
  denyASNs: [],
  allowASNs: [],
  checkProxy: true,
}

const defaultIpInfo: IPType = {
  provider: "ISP",
  country: "United States",
  isoCode: "US",
  region: "Florida",
  city: "Miami",
  asn: "AS60068",
  proxy: false,
}

describe("IPMetadataAuthorizer", () => {
  describe("validate", () => {
    it("returns true for empty config", () => {
      const authorizer = IPMetadataAuthorizer(defaultConfig).authorize(defaultIpInfo)
      expect(authorizer).toBe(true)
    })

    it("returns true for an allowed country", () => {
      const config = { ...defaultConfig, allowCountries: ["US"] }
      const authorizer = IPMetadataAuthorizer(config).authorize(defaultIpInfo)
      expect(authorizer).toBe(true)
    })

    it("returns true for a country not defined in deny-list", () => {
      const config = { ...defaultConfig, denyCountries: ["AF"] }
      const authorizer = IPMetadataAuthorizer(config).authorize(defaultIpInfo)
      expect(authorizer).toBe(true)
    })

    it("returns true for an allowed asn", () => {
      const config = { ...defaultConfig, allowASNs: ["AS60068"] }
      const authorizer = IPMetadataAuthorizer(config).authorize(defaultIpInfo)
      expect(authorizer).toBe(true)
    })

    it("returns true for an ASN not defined in deny-list", () => {
      const config = { ...defaultConfig, denyASNs: ["AS60067"] }
      const authorizer = IPMetadataAuthorizer(config).authorize(defaultIpInfo)
      expect(authorizer).toBe(true)
    })

    it("returns true for proxy/vpn if check proxy is disabled", () => {
      const ipInfo = { ...defaultIpInfo, proxy: true }
      const config = { ...defaultConfig, checkProxy: false }
      const authorizer = IPMetadataAuthorizer(config).authorize(ipInfo)
      expect(authorizer).toBe(true)
    })

    it("returns error for a country not defined in allow-list", () => {
      const config = { ...defaultConfig, allowCountries: ["US"] }
      const ipInfo = { ...defaultIpInfo, isoCode: "AF" }
      const authorizer = IPMetadataAuthorizer(config).authorize(ipInfo)
      expect(authorizer).toBeInstanceOf(UnauthorizedIPMetadataCountryError)
    })

    it("returns error for an ASN not defined in allow-list", () => {
      const config = { ...defaultConfig, allowASNs: ["AS60068"] }
      const ipInfo = { ...defaultIpInfo, asn: "AS60067" }
      const authorizer = IPMetadataAuthorizer(config).authorize(ipInfo)
      expect(authorizer).toBeInstanceOf(UnauthorizedIPMetadataASNError)
    })

    it("returns error for proxy/vpn", () => {
      const ipInfo = { ...defaultIpInfo, proxy: true }
      const authorizer = IPMetadataAuthorizer(defaultConfig).authorize(ipInfo)
      expect(authorizer).toBeInstanceOf(UnauthorizedIPMetadataProxyError)
    })

    it("returns error for empty isoCode", () => {
      const ipInfo = { ...defaultIpInfo, isoCode: undefined }
      let authorizer = IPMetadataAuthorizer(defaultConfig).authorize(ipInfo)
      expect(authorizer).toBeInstanceOf(MissingIPMetadataError)

      const ipInfo1 = { ...defaultIpInfo, isoCode: "" }
      authorizer = IPMetadataAuthorizer(defaultConfig).authorize(ipInfo1)
      expect(authorizer).toBeInstanceOf(MissingIPMetadataError)
    })

    it("returns error for empty asn", () => {
      const ipInfo = { ...defaultIpInfo, asn: undefined }
      let authorizer = IPMetadataAuthorizer(defaultConfig).authorize(ipInfo)
      expect(authorizer).toBeInstanceOf(MissingIPMetadataError)

      const ipInfo1 = { ...defaultIpInfo, asn: "" }
      authorizer = IPMetadataAuthorizer(defaultConfig).authorize(ipInfo1)
      expect(authorizer).toBeInstanceOf(MissingIPMetadataError)
    })

    it("returns error for a denied country", () => {
      const config = { ...defaultConfig, denyCountries: ["US"] }
      const authorizer = IPMetadataAuthorizer(config).authorize(defaultIpInfo)
      expect(authorizer).toBeInstanceOf(UnauthorizedIPMetadataCountryError)
    })

    it("returns error for a denied asn", () => {
      const config = { ...defaultConfig, denyASNs: ["AS60068"] }
      const authorizer = IPMetadataAuthorizer(config).authorize(defaultIpInfo)
      expect(authorizer).toBeInstanceOf(UnauthorizedIPMetadataASNError)
    })

    it("returns error for a denied/allowed country", () => {
      const config = {
        ...defaultConfig,
        denyCountries: ["US"],
        allowCountries: ["US"],
      }
      const authorizer = IPMetadataAuthorizer(config).authorize(defaultIpInfo)
      expect(authorizer).toBeInstanceOf(UnauthorizedIPMetadataCountryError)
    })

    it("returns error for a denied/allowed asn", () => {
      const config = {
        ...defaultConfig,
        denyASNs: ["AS60068"],
        allowASNs: ["AS60068"],
      }
      const authorizer = IPMetadataAuthorizer(config).authorize(defaultIpInfo)
      expect(authorizer).toBeInstanceOf(UnauthorizedIPMetadataASNError)
    })

    it("returns error for a denied asn and allowed country", () => {
      const config = {
        ...defaultConfig,
        denyASNs: ["AS60068"],
        allowCountries: ["US"],
      }
      const authorizer = IPMetadataAuthorizer(config).authorize(defaultIpInfo)
      expect(authorizer).toBeInstanceOf(UnauthorizedIPMetadataASNError)
    })

    it("returns error for a denied country and allowed asn", () => {
      const config = {
        ...defaultConfig,
        allowASNs: ["AS60068"],
        denyCountries: ["US"],
      }
      const authorizer = IPMetadataAuthorizer(config).authorize(defaultIpInfo)
      expect(authorizer).toBeInstanceOf(UnauthorizedIPMetadataCountryError)
    })
  })
})
