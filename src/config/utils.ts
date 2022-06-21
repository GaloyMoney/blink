import mergeWith from "lodash.mergewith"

export const merge = (defaultConfig, customConfig) =>
  mergeWith(defaultConfig, customConfig, (a, b) => (Array.isArray(b) ? b : undefined))
