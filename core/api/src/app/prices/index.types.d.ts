type GetCurrentPriceArgs = {
  walletCurrency: WalletCurrency
  displayCurrency: string
}

type GetCurrentSatPriceArgs = {
  currency: DisplayCurrency
}

type GetCurrentUsdCentPriceArgs = {
  currency: string
}

type GetCachedPriceArgs = {
  key: CacheKeys
  currency: DisplayCurrency
}

type DisplayCurrencyPrices = { [k: string]: RealTimePrice<DisplayCurrency> }
