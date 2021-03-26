import NodeCache from "node-cache";
import { DbVersion } from "./schema";
const grpc = require('@grpc/grpc-js');
export const mainCache = new NodeCache();

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