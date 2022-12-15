type GetCurrentPriceArgs = {
  currency?: string
}

type GetCachedPriceArgs = {
  currency: string
}

type CurrencyPrices = { [k: string]: DisplayCurrencyPerSat }
