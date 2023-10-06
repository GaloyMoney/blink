import {
  InvalidDisplayCurrencyError,
  InvalidNegativeAmountError,
  InvalidUsdCents,
  NonIntegerError,
} from "@/domain/errors"

export * from "./display-currency"
export * from "./display-amounts-converter"
export * from "./primitives"

export const toCents = (amount: number | bigint): UsdCents => {
  return Number(amount) as UsdCents
}

export const checkedToDisplayCurrency = (
  currency?: string,
): DisplayCurrency | ValidationError => {
  if (!currency || currency.length > 4) {
    return new InvalidDisplayCurrencyError(currency)
  }
  return currency.toUpperCase() as DisplayCurrency
}

export const checkedToCents = (amount: number): UsdCents | ValidationError => {
  if (!(amount && amount > 0)) return new InvalidUsdCents()
  if (!Number.isInteger(amount))
    return new NonIntegerError(`${amount} type ${typeof amount} is not an integer`)
  return toCents(amount)
}

export const OrderType = {
  Locked: "immediate",
  Active: "quote",
} as const

export const add = <T extends number>(arg0: T, arg1: T): T => (arg0 + arg1) as T
export const sub = <T extends number>(
  arg0: T,
  arg1: T,
): T | InvalidNegativeAmountError => {
  const result = arg0 - arg1
  if (result < 0) return new InvalidNegativeAmountError()
  return result as T
}
