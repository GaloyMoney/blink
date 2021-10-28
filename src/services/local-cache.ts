import NodeCache from "node-cache"
import { Price } from "@core/price-impl"
export const mainCache = new NodeCache()

export const getHourlyPrice = async ({ logger }) => {
  const key = "price:lastCached"
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
