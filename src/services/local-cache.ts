import NodeCache from "node-cache"
import { Price } from "@core/price-impl"
import { DbMetadata } from "./mongoose/schema"
export const mainCache = new NodeCache()

export const getMinBuildNumber = async () => {
  const key = "minBuildNumber"
  let value

  value = mainCache.get(key)
  if (value === undefined) {
    const { minBuildNumber, lastBuildNumber } = await DbMetadata.findOne(
      {},
      { minBuildNumber: 1, lastBuildNumber: 1, _id: 0 },
    )
    mainCache.set(key, { minBuildNumber, lastBuildNumber }, 3600)
    value = { minBuildNumber, lastBuildNumber }
  }

  return value
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
