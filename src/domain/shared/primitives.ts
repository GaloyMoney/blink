// TODO: think how to differentiate physical from synthetic USD
export const WalletCurrency = {
  Usd: "USD",
  Btc: "BTC",
} as const

export const paymentAmountFromSats = (sats: Satoshis): BtcPaymentAmount => {
  return {
    currency: WalletCurrency.Btc,
    amount: BigInt(sats),
  }
}

export const paymentAmountFromCents = (cents: UsdCents): UsdPaymentAmount => {
  return {
    currency: WalletCurrency.Usd,
    amount: BigInt(cents),
  }
}
