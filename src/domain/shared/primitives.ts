// TODO: think how to differentiate physical from synthetic USD
export const WalletCurrency = {
  Usd: "USD",
  Btc: "BTC",
} as const

export const FeeDirection = {
  ToBank: "TO_BANK",
  FromBank: "FROM_BANK",
} as const

export const BtcPaymentAmount = (sats: bigint): BtcPaymentAmount => {
  return {
    currency: WalletCurrency.Btc,
    amount: sats,
  }
}

export const UsdPaymentAmount = (cents: bigint): UsdPaymentAmount => {
  return {
    currency: WalletCurrency.Usd,
    amount: cents,
  }
}

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
