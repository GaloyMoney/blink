import fs from "fs"

import Ajv from "ajv"
import yaml from "js-yaml"

import mergeWith from "lodash.mergewith"

import { toCents } from "@/domain/fiat"
import { configSchema, getAccountLimits, yamlConfig } from "@/config"

const ajv = new Ajv()

/* eslint @typescript-eslint/ban-ts-comment: "off" */
// @ts-ignore-next-line no-implicit-any error
let validate

const merge = (defaultConfig: unknown, customConfig: unknown) =>
  mergeWith(defaultConfig, customConfig, (a, b) => (Array.isArray(b) ? b : undefined))

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
      // @ts-ignore-next-line no-implicit-any error
      const valid = validate(yamlConfig)
      expect(valid).toBeTruthy()

      const contentOrg = fs.readFileSync("./galoy.yaml", "utf8")

      fs.writeFileSync(
        "./galoy.yaml",
        yaml.dump(yamlConfig, { quotingType: '"' }),
        "utf8",
      )

      const contentNew = fs.readFileSync("./galoy.yaml", "utf8")

      expect(contentOrg).toEqual(contentNew)
    })

    it("passes with custom yaml", () => {
      const freshYamlConfig = JSON.parse(JSON.stringify(yamlConfig))
      const customYamlConfig = {
        test_accounts: [
          {
            phone: "+50365055543",
            code: "182731",
          },
        ],
      }

      const updatedYamlConfig = merge(freshYamlConfig, customYamlConfig)

      // @ts-ignore-next-line no-implicit-any error
      const valid = validate(updatedYamlConfig)
      expect(valid).toBeTruthy()
    })

    it("fails with incomplete custom yaml", () => {
      const freshYamlConfig = JSON.parse(JSON.stringify(yamlConfig))
      const customYamlConfig = {
        test_accounts: [
          {
            phone: "+50365055543",
          },
        ],
      }

      const updatedYamlConfig = merge(freshYamlConfig, customYamlConfig)

      // @ts-ignore-next-line no-implicit-any error
      const valid = validate(updatedYamlConfig)
      expect(valid).toBeFalsy()
    })

    it("fails validation missing required property", () => {
      const clonedConfig = JSON.parse(JSON.stringify(yamlConfig))
      delete clonedConfig.buildVersion

      // @ts-ignore-next-line no-implicit-any error
      const valid = validate(clonedConfig)
      expect(valid).toBeFalsy()
    })

    it("fails validation missing conditional required", () => {
      const clonedConfig = JSON.parse(JSON.stringify(yamlConfig))
      clonedConfig.cronConfig.swapEnabled = true
      delete clonedConfig.cronConfig.swapEnabled

      // @ts-ignore-next-line no-implicit-any error
      const valid = validate(clonedConfig)
      expect(valid).toBeFalsy()
    })

    it("fails validation with additional property", () => {
      const clonedConfig = JSON.parse(JSON.stringify(yamlConfig))
      clonedConfig.newProperty = "NEW PROPERTY"

      // @ts-ignore-next-line no-implicit-any error
      const valid = validate(clonedConfig)
      expect(valid).toBeFalsy()
    })

    it("fails validation with wrong type", () => {
      const clonedConfig = JSON.parse(JSON.stringify(yamlConfig))
      clonedConfig.buildVersion.android.minBuildNumber = "WRONG TYPE"

      // @ts-ignore-next-line no-implicit-any error
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
