// TODO: think how to differentiate physical from synthetic USD
export const WalletCurrency = {
  Usd: "USD",
  Btc: "BTC",
} as const

export const ExchangeCurrencyUnit = {
  Usd: "USDCENT",
  Btc: "BTCSAT",
} as const

export const ZERO_SATS = {
  currency: WalletCurrency.Btc,
  amount: 0n,
} as const

export const ZERO_CENTS = {
  currency: WalletCurrency.Usd,
  amount: 0n,
}

export const ZERO_BANK_FEE = {
  usdBankFee: ZERO_CENTS,
  btcBankFee: ZERO_SATS,
}

export const BtcWalletDescriptor = (walletId: WalletId) => {
  return {
    id: walletId,
    currency: WalletCurrency.Btc,
  } as WalletDescriptor<"BTC">
}

export const UsdWalletDescriptor = (walletId: WalletId) => {
  return {
    id: walletId,
    currency: WalletCurrency.Usd,
  } as WalletDescriptor<"USD">
}

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
