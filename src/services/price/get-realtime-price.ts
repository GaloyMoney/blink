import util from "util"
import { credentials } from "@grpc/grpc-js"
import { baseLogger } from "../logger"
import { PriceProtoDescriptor } from "./grpc"

const priceUrl = process.env.PRICE_ADDRESS ?? "galoy-price"
const pricePort = process.env.PRICE_PORT ?? "50051"
const fullUrl = `${priceUrl}:${pricePort}`
const priceClient = new PriceProtoDescriptor.PriceFeed(
  fullUrl,
  credentials.createInsecure(),
)
const getPrice = util.promisify(priceClient.getPrice).bind(priceClient)

export const getRealTimePrice = async (): Promise<number> => {
  try {
    const { price } = await getPrice({})
    if (price > 0) return price
  } catch (err) {
    baseLogger.error({ err }, "impossible to fetch most recent price")
  }
  return 0
}
