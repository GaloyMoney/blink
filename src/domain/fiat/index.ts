import { InvalidUsdCents } from "@domain/errors"

export const toCents = (amount: bigint): UsdCents => {
  return amount as UsdCents
}

export const checkedtoCents = (amount: bigint): UsdCents | ValidationError => {
  if (!(amount && amount > 0)) return new InvalidUsdCents()
  return toCents(amount)
}
