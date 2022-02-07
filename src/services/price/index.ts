import util from "util"

import { credentials } from "@grpc/grpc-js"
import {
  PriceServiceError,
  UnknownPriceServiceError,
  PriceRange,
  PriceNotAvailableError,
} from "@domain/price"

import { SATS_PER_BTC } from "@domain/bitcoin"

import { baseLogger } from "../logger"

import { PriceHistory } from "./schema"
import { PriceProtoDescriptor } from "./grpc"

const priceUrl = process.env.PRICE_ADDRESS ?? "galoy-price"
const pricePort = process.env.PRICE_PORT ?? "50051"
const fullUrl = `${priceUrl}:${pricePort}`
const priceClient = new PriceProtoDescriptor.PriceFeed(
  fullUrl,
  credentials.createInsecure(),
)
const getPrice = util.promisify(priceClient.getPrice).bind(priceClient)

export const PriceService = (): IPriceService => {
  const pair = "BTC/USD"
  const exchange = "bitfinex"

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
    interval,
  }: ListHistoryArgs): Promise<Tick[] | PriceServiceError> => {
    const startDate = new Date(getRangeStartDate(range))
    const endDate = new Date(Date.now())

    const query = [
      { $match: { "pair.name": pair, "pair.exchange.name": exchange } },
      { $unwind: "$pair.exchange.price" },
      { $match: { "pair.exchange.price._id": { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: "$pair.exchange.price._id" },
                { $mod: [{ $toLong: "$pair.exchange.price._id" }, interval] },
              ],
            },
          },
          o: { $last: "$pair.exchange.price.o" },
        },
      },
      { $sort: { _id: 1 } },
    ]

    try {
      const result = await PriceHistory.aggregate(query)
      return result.map((t: { _id: Date; o: DisplayCurrencyPerSat }) => ({
        date: t._id,
        price: t.o,
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

const getRangeStartDate = (range: PriceRange): number => {
  const startDate = new Date(Date.now())
  const resetHours = (date: Date) => date.setHours(0, 0, 0, 0)
  switch (range) {
    case PriceRange.OneDay:
      return startDate.setHours(startDate.getHours() - 24)
    case PriceRange.OneWeek:
      startDate.setHours(startDate.getHours() - 24 * 7)
      return resetHours(startDate)
    case PriceRange.OneMonth:
      startDate.setMonth(startDate.getMonth() - 1)
      return resetHours(startDate)
    case PriceRange.OneYear:
      startDate.setMonth(startDate.getMonth() - 12)
      return resetHours(startDate)
    case PriceRange.FiveYears:
      startDate.setMonth(startDate.getMonth() - 60)
      return resetHours(startDate)
  }
}
