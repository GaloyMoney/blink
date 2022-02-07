import { GT } from "@graphql/index"
import { Prices } from "@app"
import Price from "@graphql/types/object/price"
import { SAT_PRICE_PRECISION_OFFSET } from "@config"

const BtcPriceQuery = GT.Field({
  type: Price,
  resolve: async () => {
    const satPerUsd = await Prices.getCurrentPrice()

    if (satPerUsd instanceof Error) {
      throw satPerUsd
    }

    const satPerCents = 100 * satPerUsd

    return {
      formattedAmount: satPerCents.toString(),
      base: Math.round(satPerCents * 10 ** SAT_PRICE_PRECISION_OFFSET),
      offset: SAT_PRICE_PRECISION_OFFSET,
      currencyUnit: "USDCENT",
    }
  },
})

export default BtcPriceQuery
