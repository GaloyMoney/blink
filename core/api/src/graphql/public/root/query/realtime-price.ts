import { Prices } from "@/app"

import {
  majorToMinorUnit,
  USD_PRICE_PRECISION_OFFSET,
  SAT_PRICE_PRECISION_OFFSET,
  UsdDisplayCurrency,
} from "@/domain/fiat"

import { GT } from "@/graphql/index"
import { mapError } from "@/graphql/error-map"
import RealtimePrice from "@/graphql/public/types/object/realtime-price"
import DisplayCurrencyGT from "@/graphql/shared/types/scalar/display-currency"

const RealtimePriceQuery = GT.Field({
  type: GT.NonNull(RealtimePrice),
  description: `Returns 1 Sat and 1 Usd Cent price for the given currency in minor unit`,
  args: {
    currency: {
      type: DisplayCurrencyGT,
      defaultValue: UsdDisplayCurrency,
    },
  },
  resolve: async (_, args) => {
    const { currency } = args
    if (currency instanceof Error) throw currency

    const priceCurrency = await Prices.getCurrency({ currency })
    if (priceCurrency instanceof Error) throw mapError(priceCurrency)

    const btcPrice = await Prices.getCurrentSatPrice({ currency })
    if (btcPrice instanceof Error) throw mapError(btcPrice)

    const usdPrice = await Prices.getCurrentUsdCentPrice({ currency })
    if (usdPrice instanceof Error) throw mapError(usdPrice)

    const minorUnitPerSat = majorToMinorUnit({
      amount: btcPrice.price,
      displayCurrency: currency,
    })
    const minorUnitPerUsdCent = majorToMinorUnit({
      amount: usdPrice.price,
      displayCurrency: currency,
    })

    return {
      timestamp: btcPrice.timestamp,
      denominatorCurrencyDetails: priceCurrency,
      denominatorCurrency: priceCurrency.code,
      btcSatPrice: {
        base: Math.round(minorUnitPerSat * 10 ** SAT_PRICE_PRECISION_OFFSET),
        offset: SAT_PRICE_PRECISION_OFFSET,
        currencyUnit: "MINOR",
      },
      usdCentPrice: {
        base: Math.round(minorUnitPerUsdCent * 10 ** USD_PRICE_PRECISION_OFFSET),
        offset: USD_PRICE_PRECISION_OFFSET,
        currencyUnit: "MINOR",
      },
    }
  },
})

export default RealtimePriceQuery
