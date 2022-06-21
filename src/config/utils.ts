import mergeWith from "lodash.mergewith"
import isArray from "lodash.isarray"

export const merge = (defaultConfig, customConfig) =>
  mergeWith(defaultConfig, customConfig, (a, b) => (isArray(b) ? b : undefined))
