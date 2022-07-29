import mergeWith from "lodash.mergewith"

export const merge = (defaultConfig: unknown, customConfig: unknown) =>
  mergeWith(defaultConfig, customConfig, (a, b) => (Array.isArray(b) ? b : undefined))

export const intersect = <T>(a: T[], b: T[]): T[] =>
  Array.from(new Set(a)).filter((i) => new Set(b).has(i))
