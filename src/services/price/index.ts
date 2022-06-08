import util from "util"

import { credentials } from "@grpc/grpc-js"
import {
  PriceServiceError,
  UnknownPriceServiceError,
  PriceNotAvailableError,
} from "@domain/price"

import { SATS_PER_BTC } from "@domain/bitcoin"

import { baseLogger } from "../logger"

import { PriceHistoryProtoDescriptor, PriceProtoDescriptor } from "./grpc"

const priceUrl = process.env.PRICE_HOST ?? "galoy-price"
const pricePort = process.env.PRICE_PORT ?? "50051"
const fullUrl = `${priceUrl}:${pricePort}`
const priceClient = new PriceProtoDescriptor.PriceFeed(
  fullUrl,
  credentials.createInsecure(),
)
const getPrice = util.promisify(priceClient.getPrice).bind(priceClient)

const priceHistoryUrl = process.env.PRICE_HISTORY_HOST ?? "price-history"
const priceHistoryPort = process.env.PRICE_HISTORY_PORT ?? "50052"
const priceHistoryFullUrl = `${priceHistoryUrl}:${priceHistoryPort}`
const priceHistoryClient = new PriceHistoryProtoDescriptor.PriceHistory(
  priceHistoryFullUrl,
  credentials.createInsecure(),
)
const listPrices = util.promisify(priceHistoryClient.listPrices).bind(priceHistoryClient)

export const PriceService = (): IPriceService => {
  const getRealTimePrice = async (): Promise<
    DisplayCurrencyPerSat | PriceServiceError
  > => {
    try {
      const { price } = await getPrice({})
      // FIXME: price server should return CentsPerSat directly
      if (price > 0) return (price / SATS_PER_BTC) as DisplayCurrencyPerSat
      return new PriceNotAvailableError()
    } catch (err) {
      baseLogger.error({ err }, "impossible to fetch most recent price")
      return new UnknownPriceServiceError(err)
    }
  }

  const listHistory = async ({
    range,
  }: ListHistoryArgs): Promise<Tick[] | PriceServiceError> => {
    try {
      const { priceHistory } = await listPrices({ range })
      return priceHistory.map((t: { timestamp: number; price: number }) => ({
        date: new Date(t.timestamp * 1000),
        price: t.price / SATS_PER_BTC,
      }))
    } catch (err) {
      return new UnknownPriceServiceError(err)
    }
  }

  return {
    getRealTimePrice,
    listHistory,
  }
}
