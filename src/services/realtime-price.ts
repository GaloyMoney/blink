import { protoDescriptor } from "./grpc"
import { sat2btc } from "@core/utils"
import { baseLogger } from "./logger"
import { credentials } from "@grpc/grpc-js"
import { mainCache } from "./local-cache"

const priceUrl = process.env.PRICE_ADDRESS ?? "galoy-price"
const pricePort = process.env.PRICE_PORT ?? "50051"
const fullUrl = `${priceUrl}:${pricePort}`
const key = "realtimePrice"

const client = new protoDescriptor.PriceFeed(fullUrl, credentials.createInsecure())

// TODO: pass logger for better logging
export const getCurrentPrice = async (): Promise<number | undefined> => {
  // keep price in cache for 1 min in case the price pod is not online

  let price

  try {
    const promise = new Promise(
      (resolve, reject): Promise<number> =>
        client.getPrice({}, (err, { price }) => {
          if (err) {
            baseLogger.error({ err }, "impossible to fetch most recent price")
            reject(err)
          }
          resolve(price)
        }),
    )

    price = await promise
    if (!price) {
      throw new Error("price can't be null")
    }
    // FIXME switch back to 60 once price pod stop crashing
    mainCache.set(key, price, 600)
  } catch (err) {
    price = mainCache.get(key)
    if (price) {
      throw new Error("price is not available")
    }
    baseLogger.info({ price }, "using stale price")
  }

  return sat2btc(price)
}
