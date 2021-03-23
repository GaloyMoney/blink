import { DbVersion } from "./schema";
import { protoDescriptor } from "./grpc";
const grpc = require('@grpc/grpc-js');
import NodeCache from "node-cache";
import { baseLogger } from "./utils";
export const mainCache = new NodeCache();

export const getCurrentPrice = async (): Promise<number | undefined> => {
  const priceUrl = process.env.PRICE_ADDRESS ?? 'galoy-price'
  const pricePort = process.env.PRICE_PORT ??'50051'

  const client = new protoDescriptor.PriceFeed(`${priceUrl}:${pricePort}`, grpc.credentials.createInsecure());

  const promise = new Promise((resolve, reject): Promise<number | undefined> => 
    client.getPrice({}, (err, {price}) => {
      if (err) {
        baseLogger.error({err}, "impossible to fetch most recent price")
        reject(err)
      }
      resolve(price)
  }))

  let price

  try {
    price = await promise
  } catch (err) {
    // TODO use caching and fail after 60 sec of stale data

    return undefined
  }

  return price
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