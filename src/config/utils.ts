import mergeWith from "lodash.mergewith"

export const merge = (defaultConfig: unknown, customConfig: unknown) =>
  mergeWith(defaultConfig, customConfig, (a, b) => (Array.isArray(b) ? b : undefined))

export class ModifiedSet extends Set {
  intersect<T>(otherSet: Set<T>): Set<T> {
    return new ModifiedSet(Array.from(this).filter((i) => otherSet.has(i)))
  }
}
