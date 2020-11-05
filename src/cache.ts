import { Price } from "./priceImpl";
import { baseLogger } from "./utils";

const NodeCache = require( "node-cache" );
export const mainCache = new NodeCache();


export const getLastPrice = async (): Promise<number> => {
  const key = "lastPrices"
  let lastPrice

  lastPrice = mainCache.get(key);
  if ( lastPrice === undefined ){
    lastPrice = await new Price({ logger: baseLogger }).lastPrice()
    mainCache.set( key, lastPrice, [ 300 ] )
  }

  return lastPrice
}