import mergeWith from "lodash.mergewith"
import isArray from "lodash.isarray"

const merge = (defaultConfig, customConfig) =>
  mergeWith(defaultConfig, customConfig, (a, b) => (isArray(b) ? b : undefined))

export default merge
