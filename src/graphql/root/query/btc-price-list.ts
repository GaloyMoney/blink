import moment from "moment"
import { GT } from "@graphql/index"
import PricePoint from "@graphql/types/object/price-point"
import PriceGraphRange, {
  priceRangeValues,
} from "@graphql/types/scalar/price-graph-range"
import { PriceService } from "@services/price"
import { PriceInterval, PriceRange } from "@domain/price"

const parseRange: (string: typeof priceRangeValues[number]) => PriceRange = (range) => {
  switch (range) {
    case "ONE_DAY":
      return PriceRange.OneDay
    case "ONE_WEEK":
      return PriceRange.OneWeek
    case "ONE_MONTH":
      return PriceRange.OneMonth
    case "ONE_YEAR":
      return PriceRange.OneYear
    case "FIVE_YEARS":
      return PriceRange.FiveYears
  }
}

const parseInterval: (string: typeof priceRangeValues[number]) => PriceInterval = (
  range,
) => {
  switch (range) {
    case "ONE_DAY":
      return PriceInterval.OneHour
    case "ONE_WEEK":
      return PriceInterval.FourHours
    case "ONE_MONTH":
      return PriceInterval.OneDay
    case "ONE_YEAR":
      return PriceInterval.OneWeek
    case "FIVE_YEARS":
      return PriceInterval.OneMonth
  }
}

const BtcPriceListQuery = GT.Field({
  type: GT.List(PricePoint),
  args: {
    range: {
      type: GT.NonNull(PriceGraphRange),
    },
  },
  resolve: async (_, args) => {
    const priceService = PriceService()
    const range = parseRange(args.range)
    const interval = parseInterval(args.range)

    if (!range) throw new Error("Invalid range")

    const hourlyPrices = await priceService.listHistory(range, interval)
    if (hourlyPrices instanceof Error) throw hourlyPrices

    const prices: PricePointType[] = hourlyPrices.map(({ date, price }) => {
      const btcPriceInCents = price * 100 * 10 ** 8
      return {
        timestamp: Math.floor(date.getTime() / 1000),
        price: {
          formattedAmount: btcPriceInCents.toString(),
          base: Math.round(btcPriceInCents * 10 ** 4),
          offset: 4,
          currencyUnit: "USDCENT",
        },
      }
    })

    // Add the current price as the last item in the array
    // This is used by the mobile app to convert prices
    const currentPrice = await priceService.getCurrentPrice()
    if (!(currentPrice instanceof Error)) {
      const currentBtcPriceInCents = currentPrice * 100 * 10 ** 8
      prices.push({
        timestamp: moment().unix(),
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
