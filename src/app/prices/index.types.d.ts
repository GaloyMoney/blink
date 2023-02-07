type GetCurrentPriceArgs = {
  walletCurrency: WalletCurrency
  displayCurrency: string
}

type GetCurrentSatPriceArgs = {
  currency: string
}

type GetCurrentUsdCentPriceArgs = {
  currency: string
}

type GetCachedPriceArgs = {
  key: CacheKeys
  currency: DisplayCurrency
}

type DisplayCurrencyPrices = { [k: string]: RealTimePrice<DisplayCurrency> }
