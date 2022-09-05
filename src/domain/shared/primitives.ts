import { safeBigInt } from "./safe"

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

// 100_000 BTC is the max amount you can make a hodl invoice for in lnd
export const MAX_SATS = {
  currency: WalletCurrency.Btc,
  amount: 10_000_000_000_000n,
} as const

// Assumes optimistic price under sat-cent parity
export const MAX_CENTS = {
  currency: WalletCurrency.Usd,
  amount: 100_000_000_000_00n,
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

export const paymentAmountFromNumber = <T extends WalletCurrency>({
  amount,
  currency,
}: {
  amount: number
  currency: T
}): PaymentAmount<T> | ValidationError => {
  const safeAmount = safeBigInt(amount)
  if (safeAmount instanceof Error) return safeAmount

  return {
    amount: safeAmount,
    currency,
  }
}

export const balanceAmountFromNumber = <T extends WalletCurrency>({
  amount,
  currency,
}: {
  amount: number
  currency: T
}): BalanceAmount<T> | ValidationError => {
  const safeAmount = safeBigInt(amount)
  if (safeAmount instanceof Error) return safeAmount

  return {
    amount: safeAmount,
    currency,
  }
}
