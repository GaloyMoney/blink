import { SAT_PRICE_PRECISION_OFFSET } from "@config"

import { Prices } from "@app"

import { DisplayCurrency } from "@domain/fiat"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import Price from "@graphql/types/object/price"
import DisplayCurrencyGT from "@graphql/types/scalar/display-currency"

const BtcPriceQuery = GT.Field({
  type: Price,
  args: {
    currency: { type: GT.NonNull(DisplayCurrencyGT), defaultValue: DisplayCurrency.Usd },
  },
  resolve: async (_, args) => {
    const { currency } = args
    if (currency instanceof Error) throw currency

    const satCurrencyPrice = await Prices.getCurrentPrice({ currency })

    if (satCurrencyPrice instanceof Error) {
      throw mapError(satCurrencyPrice)
    }

    const price = 100 * satCurrencyPrice

    return {
      formattedAmount: price.toString(),
      base: Math.round(price * 10 ** SAT_PRICE_PRECISION_OFFSET),
      offset: SAT_PRICE_PRECISION_OFFSET,
      currencyUnit: `${currency}CENT`,
    }
  },
})

export default BtcPriceQuery
