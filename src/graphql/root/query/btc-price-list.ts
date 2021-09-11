import { GT } from "@graphql/index"

import { MS_PER_DAY } from "@config/app"

import PricePoint from "@graphql/types/object/price-point"
import PriceGraphRange, {
  priceRangeValues,
} from "@graphql/types/scalar/price-graph-range"

import { getHourlyPrice } from "@services/local-cache"
import { getCurrentPrice } from "@services/realtime-price"

const rangeStartDateMS: (string: typeof priceRangeValues[number]) => number = (range) => {
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
  }
}

const BtcPriceListQuery = GT.Field({
  type: GT.List(PricePoint),
  args: {
    range: {
      type: GT.NonNull(PriceGraphRange),
    },
  },
  resolve: async (_, args, { logger }) => {
    const { range } = args

    const rangeStart = rangeStartDateMS(range)

    if (!rangeStart) {
      throw new Error("Invalid range")
    }

    const hourlyPrices = await getHourlyPrice({ logger })

    const prices: PricePointType[] = []

    for (const price of hourlyPrices) {
      if (1000 * price.id < rangeStart) {
        break
      }
      const btcPriceInCents = price.o * 100 * 10 ** 8
      prices.push({
        timestamp: price.id,
        price: {
          formattedAmount: btcPriceInCents.toString(),
          base: Math.round(btcPriceInCents * 10 ** 4),
          offset: 4,
          currencyUnit: "USDCENT",
        },
      })
    }

    // Add the current price as the last item in the array
    // This is used by the mobile app to convert prices
    const currentPrice = await getCurrentPrice()
    if (currentPrice) {
      const currentBtcPriceInCents = currentPrice * 100 * 10 ** 8
      prices.push({
        timestamp: Date.now(),
        price: {
          formattedAmount: currentBtcPriceInCents.toString(),
          base: Math.round(currentBtcPriceInCents * 10 ** 4),
          offset: 4,
          currencyUnit: "USDCENT",
        },
      })
    }

    return prices
  },
})

export default BtcPriceListQuery
