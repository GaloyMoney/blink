import { toSats } from "@domain/bitcoin"
import { InvalidUsdCents, NonIntegerUsdCents } from "@domain/errors"

export const toCents = (amount: number): UsdCents => {
  // safety protection during dev. remove before prod (should not throw)
  if (!Number.isInteger(amount))
    throw new NonIntegerUsdCents(`${amount} type ${typeof amount} is not an integer`)
  return amount as UsdCents
}

export const checkedtoCents = (amount: number): UsdCents | ValidationError => {
  if (!(amount && amount > 0)) return new InvalidUsdCents()
  if (!Number.isInteger(amount))
    return new NonIntegerUsdCents(`${amount} type ${typeof amount} is not an integer`)
  return toCents(amount)
}

export const satsToCentsOptionPricing = ({
  price,
  usdCents,
}: {
  price: UsdPerSat
  usdCents: UsdCents
  // TODO: should we have a currency property? or make UsdCents subtype per fiat currency?
}) => {
  // TODO: add time value of option
  // TODO: add spread

  return toSats(Math.ceil(usdCents / price))
}
