import { SAT_PRICE_PRECISION_OFFSET, USD_PRICE_PRECISION_OFFSET } from "@config"

import { Prices } from "@app"

import { DisplayCurrency } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"

import { GT } from "@graphql/index"
import { mapError } from "@graphql/error-map"
import RealtimePrice from "@graphql/types/object/realtime-price"
import WalletCurrencyGT from "@graphql/types/scalar/wallet-currency"
import DisplayCurrencyGT from "@graphql/types/scalar/display-currency"

const RealtimePriceQuery = GT.Field({
  type: RealtimePrice,
  description: `Returns 1 Sat or 1 Cent price for the given quote display currency`,
  args: {
    walletCurrency: {
      type: GT.NonNull(WalletCurrencyGT),
      defaultValue: WalletCurrency.Btc,
    },
    displayCurrency: {
      type: GT.NonNull(DisplayCurrencyGT),
      defaultValue: DisplayCurrency.Usd,
    },
  },
  resolve: async (_, args) => {
    const { walletCurrency, displayCurrency } = args
    if (walletCurrency instanceof Error) throw walletCurrency
    if (displayCurrency instanceof Error) throw displayCurrency

    const satDisplayCurrencyPrice = await Prices.getCurrentPrice({
      currency: displayCurrency,
    })
    if (satDisplayCurrencyPrice instanceof Error) throw mapError(satDisplayCurrencyPrice)

    let price: number = 100 * satDisplayCurrencyPrice.price
    let offset = SAT_PRICE_PRECISION_OFFSET
    let timestamp = satDisplayCurrencyPrice.timestamp
    if (walletCurrency === WalletCurrency.Usd) {
      const satUsdPrice = await Prices.getCurrentPrice({ currency: DisplayCurrency.Usd })
      if (satUsdPrice instanceof Error) throw mapError(satUsdPrice)

      price = satDisplayCurrencyPrice.price / satUsdPrice.price
      offset = USD_PRICE_PRECISION_OFFSET
      timestamp = satUsdPrice.timestamp
    }

    return {
      timestamp,
      base: Math.round(price * 10 ** offset),
      offset,
      walletCurrency,
      displayCurrency,
      currencyUnit: `${displayCurrency}CENT`,
      formattedAmount: price.toFixed(8),
    }
  },
})

export default RealtimePriceQuery
