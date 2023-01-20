type GetCurrentPriceArgs = {
  currency: string
}

type GetCachedPriceArgs = {
  currency: DisplayCurrency
}

type DisplayCurrencyPrices = { [k: string]: DisplayCurrencyPerSat }
