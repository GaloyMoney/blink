import fs from "fs"
import yaml from "js-yaml"
import _ from "lodash"
import { baseLogger } from "./logger"

const defaultContent = fs.readFileSync("./default.yaml", "utf8")
export const defaultConfig = yaml.load(defaultContent)

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
