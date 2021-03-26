import NodeCache from "node-cache";
import { protoDescriptor } from "./grpc";
import { baseLogger, sat2btc } from "./utils";
import grpc from '@grpc/grpc-js';
export const mainCache = new NodeCache();

const priceUrl = process.env.PRICE_ADDRESS ?? 'galoy-price'
const pricePort = process.env.PRICE_PORT ?? '50051'
const fullUrl = `${priceUrl}:${pricePort}`
const key = "realtimePrice"

const client = new protoDescriptor.PriceFeed(fullUrl, grpc.credentials.createInsecure());

export const getCurrentPrice = async (): Promise<number | undefined> => {
  // keep price in cache for 1 min in case the price pod is not online

  let price

  const promise = new Promise((resolve, reject): Promise<number> => 
    client.getPrice({}, (err, {price}) => {
      if (err) {
        baseLogger.error({err}, "impossible to fetch most recent price")
        reject(err)
      }
      resolve(price)
  }))

  try {
    price = await promise
    mainCache.set( key, price, 60 )
  } catch (err) {
    price = mainCache.get(key);
    if (!!price) {
      throw new Error("price is not available")
    }
  }

  return sat2btc(price)
}
