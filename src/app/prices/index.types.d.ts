type GetCurrentPriceArgs = {
  currency: string
}

type CurrentPrice = {
  timestamp: Date
  price: DisplayCurrencyPerSat
}

type GetCachedPriceArgs = {
  currency: DisplayCurrency
}

type DisplayCurrencyPrices = { [k: string]: CurrentPrice }
