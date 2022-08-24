import {
  InvalidNegativeAmountError,
  InvalidUsdCents,
  NonIntegerError,
} from "@domain/errors"

export * from "./display-currency"

export const toCents = (amount: number | bigint): UsdCents => {
  return Number(amount) as UsdCents
}

export const toCentsPerSatsRatio = (amount: number): CentsPerSatsRatio => {
  return amount as CentsPerSatsRatio
}

export const checkedtoCents = (amount: number): UsdCents | ValidationError => {
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

export const DisplayCurrency = {
  Usd: "USD",
  Btc: "BTC",
  Crc: "CRC",
} as const
