import { GT } from "@graphql/index"

import { MS_PER_DAY } from "@config/app"

import BtcUsdPrice from "@graphql/types/object/btc-usd-price"
import PriceGraphRange from "@graphql/types/scalar/price-graph-range"

import { getHourlyPrice } from "@services/local-cache"
import { getCurrentPrice } from "@services/realtime-price"

const rangeStartDateMS: (string) => number | Error = (range) => {
  const currentTimestamp = Date.now()

  switch (range) {
    case "ONE_DAY":
      return currentTimestamp - MS_PER_DAY
    case "ONE_WEEK":
      return currentTimestamp - 7 * MS_PER_DAY
    case "ONE_MONTH":
      return currentTimestamp - 30 * MS_PER_DAY
    case "ONE_YEAR":
      return currentTimestamp - 365 * MS_PER_DAY
    case "FIVE_YEARS":
      return currentTimestamp - 5 * 365 * MS_PER_DAY
    default:
      return new Error("Invalid range value")
  }
}

const BtcUsdPriceListForGraphQuery = GT.Field({
  type: GT.List(BtcUsdPrice),
  args: {
    range: {
      type: GT.NonNull(PriceGraphRange),
    },
  },
  resolve: async (_, args, { logger }) => {
    const { range } = args

    const rangeStart = rangeStartDateMS(range)

    if (rangeStart instanceof Error) {
      throw Error
    }

    const hourlyPrices = await getHourlyPrice({ logger })

    const prices: Record<"timestamp" | "price", number>[] = []

    for (const price of hourlyPrices) {
      if (1000 * price.id < rangeStart) {
        break
      }
      prices.push({ timestamp: price.id, price: price.o })
    }

    // Add the current price as the last item in the array
    // This is used by the mobile app to convert prices
    const currentPrice = await getCurrentPrice()
    if (currentPrice) {
      prices.push({
        timestamp: Date.now(),
        price: currentPrice,
      })
    }

    return prices
  },
})

export default BtcUsdPriceListForGraphQuery
