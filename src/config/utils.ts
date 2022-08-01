import mergeWith from "lodash.mergewith"

export const merge = (defaultConfig: unknown, customConfig: unknown) =>
  mergeWith(defaultConfig, customConfig, (a, b) => (Array.isArray(b) ? b : undefined))
