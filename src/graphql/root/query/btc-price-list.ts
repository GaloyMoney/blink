import { GT } from "@graphql/index"
import PricePoint from "@graphql/types/object/price-point"
import PriceGraphRange, {
  priceRangeValues,
} from "@graphql/types/scalar/price-graph-range"
import { InputValidationError } from "@graphql/error"
import { PriceInterval, PriceRange } from "@domain/price"
import { BTC_PRICE_PRECISION_OFFSET } from "@config"
import { Prices } from "@app"
import { SATS_PER_BTC } from "@domain/bitcoin"
import { mapError } from "@graphql/error-map"

const parseRange: (
  string: typeof priceRangeValues[number],
) => PriceRange | InputValidationError = (range) => {
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
    default:
      return new InputValidationError({ message: "Invalid value for 'range'." })
  }
}

const parseInterval: (
  string: typeof priceRangeValues[number],
) => PriceInterval | InputValidationError = (range) => {
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
    default:
      return new InputValidationError({ message: "Invalid value for 'range'." })
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
    const range = parseRange(args.range)
    const interval = parseInterval(args.range)

    if (range instanceof Error) throw range
    if (interval instanceof Error) throw interval

    const hourlyPrices = await Prices.getPriceHistory({ range, interval })
    if (hourlyPrices instanceof Error) throw mapError(hourlyPrices)

    const prices: PricePointType[] = hourlyPrices.map(({ date, price }) => {
      const btcPriceInCents = price * 100 * SATS_PER_BTC
      return {
        timestamp: Math.floor(date.getTime() / 1000),
        price: {
          formattedAmount: btcPriceInCents.toString(),
          base: Math.round(btcPriceInCents * 10 ** BTC_PRICE_PRECISION_OFFSET),
          offset: BTC_PRICE_PRECISION_OFFSET,
          currencyUnit: "USDCENT",
        },
      }
    })

    // Add the current price as the last item in the array
    // This is used by the mobile app to convert prices
    const currentPrice = await Prices.getCurrentPrice()
    if (!(currentPrice instanceof Error)) {
      const currentBtcPriceInCents = currentPrice * 100 * SATS_PER_BTC
      prices.push({
        timestamp: Math.round(new Date().getTime() / 1000),
        price: {
          formattedAmount: currentBtcPriceInCents.toString(),
          base: Math.round(currentBtcPriceInCents * 10 ** BTC_PRICE_PRECISION_OFFSET),
          offset: BTC_PRICE_PRECISION_OFFSET,
          currencyUnit: "USDCENT",
        },
      })
    }

    return prices
  },
})

export default BtcPriceListQuery
