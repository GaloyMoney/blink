import { DbVersion } from "./schema";
import { protoDescriptor } from "./grpc";
const grpc = require('@grpc/grpc-js');
import NodeCache from "node-cache";
import { baseLogger, sat2btc } from "./utils";
export const mainCache = new NodeCache();

export const getCurrentPrice = async (): Promise<number | undefined> => {
  // keep price in cache for 1 min in case the price pod is not online

  const priceUrl = process.env.PRICE_ADDRESS ?? 'galoy-price'
  const pricePort = process.env.PRICE_PORT ?? '50051'
  const fullUrl = `${priceUrl}:${pricePort}`
  const key = "realtimePrice"


  let price

  const client = new protoDescriptor.PriceFeed(fullUrl, grpc.credentials.createInsecure());

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

export const getMinBuildNumber = async () => {
  const key = "minBuildNumber"
  let value

  value = mainCache.get(key);
  if ( value === undefined ){
    const { minBuildNumber, lastBuildNumber } = await DbVersion.findOne({}, { minBuildNumber: 1, lastBuildNumber: 1, _id: 0 })
    mainCache.set( key, { minBuildNumber, lastBuildNumber }, 3600 )
    value = { minBuildNumber, lastBuildNumber }
  }

  return value
}