import mergeWith from "lodash.mergewith"

const merge = (defaultConfig, customConfig) =>
  mergeWith(defaultConfig, customConfig, (a, b) => (Array.isArray(b) ? b : undefined))

export default merge
