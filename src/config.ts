import fs from "fs"
import yaml from "js-yaml"
import _ from "lodash"
import { baseLogger } from "./logger"
import { SpecterWalletConfig } from "./types"

const defaultContent = fs.readFileSync("./default.yaml", "utf8")
export const defaultConfig = yaml.load(defaultContent)

const MS_IN_HOUR = 60 * 60 * 1000

let customContent, customConfig

try {
  customContent = fs.readFileSync("/var/yaml/custom.yaml", "utf8")
  customConfig = yaml.load(customContent)
} catch (err) {
  if (process.env.NETWORK !== "regtest") {
    baseLogger.info({ err }, "no custom.yaml available. loading default values")
  }
}

export const yamlConfig = _.merge(defaultConfig, customConfig)

export class TransactionLimits {
  config
  level

  constructor({ config, level }) {
    this.config = config
    this.level = level
  }

  onUsLimit = () => this.config.onUs.level[this.level]

  withdrawalLimit = () => this.config.withdrawal.level[this.level]

  oldEnoughForWithdrawalLimit = () => this.config.oldEnoughForWithdrawal / MS_IN_HOUR
}

export const getSpecterWalletConfig = (): SpecterWalletConfig => ({
  lndHoldingBase: yamlConfig.rebalancing.lndHoldingBase,
  ratioTargetDeposit: yamlConfig.rebalancing.ratioTargetDeposit,
  ratioTargetWithdraw: yamlConfig.rebalancing.ratioTargetWithdraw,
  minOnchain: yamlConfig.rebalancing.minOnchain,
  onchainWallet: yamlConfig.rebalancing.onchainWallet || "specter",
})
