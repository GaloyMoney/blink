// in the future, we may have:
// - saving account (not redeemable instantly)
// - borrowing account based on collateral
export const WalletType = {
  Checking: "checking",
} as const

// TODO: think how to differentiate physical from synthetic USD
export const WalletCurrency = {
  Usd: "USD",
  Btc: "BTC",
} as const
