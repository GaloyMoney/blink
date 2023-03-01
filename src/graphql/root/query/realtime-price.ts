import { SAT_PRICE_PRECISION_OFFSET, USD_PRICE_PRECISION_OFFSET } from "@config"

import { Prices } from "@app"

import { DisplayCurrency, usdMajorToMinorUnit } from "@domain/fiat"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import RealtimePrice from "@graphql/types/object/realtime-price"
import DisplayCurrencyGT from "@graphql/types/scalar/display-currency"

const RealtimePriceQuery = GT.Field({
  type: GT.NonNull(RealtimePrice),
  description: `Returns 1 Sat and 1 Usd Cent price for the given currency`,
  args: {
    currency: {
      type: DisplayCurrencyGT,
      defaultValue: DisplayCurrency.Usd,
    },
  },
  resolve: async (_, args) => {
    const { currency } = args
    if (currency instanceof Error) throw currency

    const btcPrice = await Prices.getCurrentSatPrice({
      currency,
    })
    if (btcPrice instanceof Error) throw mapError(btcPrice)

    const usdPrice = await Prices.getCurrentUsdCentPrice({
      currency,
    })
    if (usdPrice instanceof Error) throw mapError(usdPrice)

    const centsPerSat = usdMajorToMinorUnit(btcPrice.price)
    const centsPerUsdCent = usdMajorToMinorUnit(usdPrice.price)

    return {
      timestamp: btcPrice.timestamp,
      denominatorCurrency: currency,
      btcSatPrice: {
        base: Math.round(centsPerSat * 10 ** SAT_PRICE_PRECISION_OFFSET),
        offset: SAT_PRICE_PRECISION_OFFSET,
        currencyUnit: `${currency}CENT`,
      },
      usdCentPrice: {
        base: Math.round(centsPerUsdCent * 10 ** USD_PRICE_PRECISION_OFFSET),
        offset: USD_PRICE_PRECISION_OFFSET,
        currencyUnit: `${currency}CENT`,
      },
    }
  },
})

export default RealtimePriceQuery
