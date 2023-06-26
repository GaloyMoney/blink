import { safeBigInt } from "./safe"
import { WalletCurrency } from "./primitives"
import {
  InvalidUsdPaymentAmountError,
  InvalidBtcPaymentAmountError,
  UsdAmountTooLargeError,
  BtcAmountTooLargeError,
} from "./errors"

export const ZERO_SATS = {
  currency: WalletCurrency.Btc,
  amount: 0n,
} as const

export const ZERO_CENTS = {
  currency: WalletCurrency.Usd,
  amount: 0n,
}

export const ONE_SAT = {
  amount: 1n,
  currency: WalletCurrency.Btc,
}

export const ONE_CENT = {
  currency: WalletCurrency.Usd,
  amount: 1n,
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

export const checkedToBtcPaymentAmount = (
  amount: number | null,
): BtcPaymentAmount | ValidationError => {
  if (amount === null) {
    return new InvalidBtcPaymentAmountError()
  }

  if (amount > MAX_SATS.amount) {
    return new BtcAmountTooLargeError()
  }

  if (Math.floor(amount) != amount) {
    return new InvalidBtcPaymentAmountError()
  }
  if (!(amount && amount > 0)) return new InvalidBtcPaymentAmountError()
  return paymentAmountFromNumber({ amount, currency: WalletCurrency.Btc })
}

export const UsdPaymentAmount = (cents: bigint): UsdPaymentAmount => {
  return {
    currency: WalletCurrency.Usd,
    amount: cents,
  }
}

export const checkedToUsdPaymentAmount = (
  amount: number | null,
): UsdPaymentAmount | ValidationError => {
  if (amount === null) {
    return new InvalidUsdPaymentAmountError()
  }

  if (amount > MAX_CENTS.amount) {
    return new UsdAmountTooLargeError()
  }

  if (Math.floor(amount) != amount) {
    return new InvalidUsdPaymentAmountError()
  }
  if (!(amount && amount > 0)) return new InvalidUsdPaymentAmountError()
  return paymentAmountFromNumber({ amount, currency: WalletCurrency.Usd })
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
