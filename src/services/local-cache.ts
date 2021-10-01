import NodeCache from "node-cache"
import { Price } from "@core/price-impl"
import { DbMetadata } from "./mongoose/schema"
export const mainCache = new NodeCache()

type BuildNumbers = {
  minBuildNumber: number
  lastBuildNumber: number
}

export const getBuildVersionNumbers = async (): Promise<BuildNumbers | Error> => {
  const key = "minBuildNumber"
  let versions = mainCache.get(key) as BuildNumbers

  if (versions === undefined) {
    versions = await DbMetadata.findOne(
      {},
      { minBuildNumber: 1, lastBuildNumber: 1, _id: 0 },
    )
    if (versions?.minBuildNumber && versions?.lastBuildNumber) {
      mainCache.set(key, versions, 3600)
    }
  }

  if (versions?.minBuildNumber && versions?.lastBuildNumber) {
    return versions
  }

  return new Error("Build version numbers are missing")
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
