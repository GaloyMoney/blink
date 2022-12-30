import { Prices } from "@app"
import { GT } from "@graphql/index"
import Price from "@graphql/types/object/price"
import { mapError } from "@graphql/error-map"
import { SAT_PRICE_PRECISION_OFFSET } from "@config"

const BtcPriceQuery = GT.Field({
  type: Price,
  resolve: async () => {
    const satUsdPrice = await Prices.getCurrentPrice()

    if (satUsdPrice instanceof Error) {
      throw mapError(satUsdPrice)
    }

    const price = 100 * satUsdPrice

    return {
      formattedAmount: price.toString(),
      base: Math.round(price * 10 ** SAT_PRICE_PRECISION_OFFSET),
      offset: SAT_PRICE_PRECISION_OFFSET,
      currencyUnit: "USDCENT",
    }
  },
})

export default BtcPriceQuery
