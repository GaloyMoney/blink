import { WalletCurrency } from "./primitives"

export const ZERO_SATS = {
  currency: WalletCurrency.Btc,
  amount: 0n,
} as const

export const AmountCalculator = () => {
  const add = <T extends WalletCurrency>(a: PaymentAmount<T>, b: PaymentAmount<T>) => {
    return {
      currency: a.currency,
      amount: a.amount + b.amount,
    }
  }

  const sub = <T extends WalletCurrency>(a: PaymentAmount<T>, b: PaymentAmount<T>) => {
    return {
      currency: a.currency,
      amount: a.amount - b.amount,
    }
  }

  return {
    sub,
    add,
  }
}
