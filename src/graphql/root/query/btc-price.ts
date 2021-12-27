import { GT } from "@graphql/index"
import { Prices } from "@app"
import Price from "@graphql/types/object/price"

const BtcPriceQuery = GT.Field({
  type: Price,
  resolve: async () => {
    const satUsdPrice = await Prices.getCurrentPrice()

    if (satUsdPrice instanceof Error) {
      throw satUsdPrice
    }

    const price = 100 * satUsdPrice

    return {
      formattedAmount: price.toString(),
      base: Math.round(price * 10 ** 12),
      offset: 12,
      currencyUnit: "USDCENT",
    }
  },
})

export default BtcPriceQuery
