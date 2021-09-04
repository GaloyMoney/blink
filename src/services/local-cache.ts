import NodeCache from "node-cache"
import { Price } from "@core/price-impl"
import { DbMetadata } from "./mongoose/schema"
export const mainCache = new NodeCache()

export const getMinBuildNumber = async () => {
  const key = "minBuildNumber"
  let versions

  versions = mainCache.get(key)
  if (versions === undefined) {
    const { minBuildNumber, lastBuildNumber } = await DbMetadata.findOne(
      {},
      { minBuildNumber: 1, lastBuildNumber: 1, _id: 0 },
    )
    versions = { minBuildNumber, lastBuildNumber }
    mainCache.set(key, versions, 3600)
  }

  return versions
}

export const getHourlyPrice = async ({ logger }) => {
  const key = "lastCached"
  let value

  value = mainCache.get(key)
  if (value === undefined) {
    const price = new Price({ logger })
    const lastCached = await price.lastCached()
    mainCache.set(key, lastCached, 300)
    value = lastCached
  }

  return value
}
