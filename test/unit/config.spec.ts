import fs from "fs"

import { configSchema, getAccountLimits, yamlConfig, merge } from "@config"
import { toCents } from "@domain/fiat"
import Ajv from "ajv"
import yaml from "js-yaml"

const ajv = new Ajv()
let validate

const accountLimits = {
  withdrawal: {
    level: {
      1: toCents(2_000_000),
      2: toCents(100_000_000),
    },
  },
  intraLedger: {
    level: {
      1: toCents(5_000_000),
      2: toCents(100_000_000),
    },
  },
  tradeIntraAccount: {
    level: {
      1: toCents(5_000_000),
      2: toCents(100_000_000),
    },
  },
}

describe("config.ts", () => {
  describe("yml config validation", () => {
    beforeAll(() => {
      validate = ajv.compile(configSchema)
    })

    it("passes validation with valid config", () => {
      const valid = validate(yamlConfig)
      expect(valid).toBeTruthy()

      fs.writeFileSync(
        "./galoy.yaml",
        yaml.dump(yamlConfig, { quotingType: '"' }),
        "utf8",
      )
    })

    it("passes validation with conditional not required", () => {
      const clonedConfig = JSON.parse(JSON.stringify(yamlConfig))
      clonedConfig.apollo.playground = false
      delete clonedConfig.apollo.playgroundUrl

      const valid = validate(clonedConfig)
      expect(valid).toBeTruthy()
    })

    it("passes with custom yaml", () => {
      const freshYamlConfig = JSON.parse(JSON.stringify(yamlConfig))
      const customYamlConfig = {
        lnds: [
          { name: "LND1", type: ["onchain"], priority: 2 },
          { name: "LND2", type: ["offchain"], priority: 1 },
        ],
        test_accounts: [
          {
            ref: "A",
            phone: "+50365055543",
            code: "182731",
            needUsdWallet: true,
            currency: "BTC",
          },
        ],
      }

      const updatedYamlConfig = merge(freshYamlConfig, customYamlConfig)
      const valid = validate(updatedYamlConfig)
      expect(valid).toBeTruthy()
    })

    it("fails with incomplete custom yaml", () => {
      const freshYamlConfig = JSON.parse(JSON.stringify(yamlConfig))
      const customYamlConfig = {
        test_accounts: [
          {
            phone: "+50365055543",
            code: "182731",
            currency: "BTC",
          },
        ],
      }

      const updatedYamlConfig = merge(freshYamlConfig, customYamlConfig)
      const valid = validate(updatedYamlConfig)
      expect(valid).toBeFalsy()
    })

    it("fails validation missing required property", () => {
      const clonedConfig = JSON.parse(JSON.stringify(yamlConfig))
      delete clonedConfig.lnds
      const valid = validate(clonedConfig)
      expect(valid).toBeFalsy()
    })

    it("fails validation missing conditional required", () => {
      const clonedConfig = JSON.parse(JSON.stringify(yamlConfig))
      clonedConfig.apollo.playground = true
      delete clonedConfig.apollo.playgroundUrl

      const valid = validate(clonedConfig)
      expect(valid).toBeFalsy()
    })

    it("fails validation with additional property", () => {
      const clonedConfig = JSON.parse(JSON.stringify(yamlConfig))
      clonedConfig.newProperty = "NEW PROPERTY"
      const valid = validate(clonedConfig)
      expect(valid).toBeFalsy()
    })

    it("fails validation with wrong type", () => {
      const clonedConfig = JSON.parse(JSON.stringify(yamlConfig))
      clonedConfig.buildVersion.android.minBuildNumber = "WRONG TYPE"
      const valid = validate(clonedConfig)
      expect(valid).toBeFalsy()
    })
  })

  describe("generates expected constants from a limits config object", () => {
    it("selects user limits for level 1", () => {
      const userLimits = getAccountLimits({ level: 1, accountLimits })
      expect(userLimits.tradeIntraAccountLimit).toEqual(5_000_000)
      expect(userLimits.intraLedgerLimit).toEqual(5_000_000)
      expect(userLimits.withdrawalLimit).toEqual(2_000_000)
    })

    it("selects user limits for level 2", () => {
      const userLimits = getAccountLimits({ level: 2, accountLimits })
      expect(userLimits.tradeIntraAccountLimit).toEqual(100_000_000)
      expect(userLimits.intraLedgerLimit).toEqual(100_000_000)
      expect(userLimits.withdrawalLimit).toEqual(100_000_000)
    })
  })
})
