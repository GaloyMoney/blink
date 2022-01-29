import { toSats } from "@domain/bitcoin"
import { InvalidUsdAmount, NonIntegeterUsdAmount } from "@domain/errors"

export const toUsd = (amount: number): UsdAmount => {
  // safety protection during dev. remove before prod (should not throw)
  if (!Number.isInteger(amount))
    throw new NonIntegeterUsdAmount(`${amount} type ${typeof amount} is not an integer`)
  return amount as UsdAmount
}

export const checkedtoUsd = (amount: number): UsdAmount | ValidationError => {
  if (!(amount && amount > 0)) return new InvalidUsdAmount()
  if (!Number.isInteger(amount))
    return new NonIntegeterUsdAmount(`${amount} type ${typeof amount} is not an integer`)
  return toUsd(amount)
}

export const satstoUsdOptionPricing = ({
  price,
  usdAmount,
}: {
  price: UsdPerSat
  usdAmount: UsdAmount
  // TODO: should we have a currency property? or make UsdAmount subtype per fiat currency?
}) => {
  // TODO: add time value of option
  // TODO: add spread

  return toSats(Math.ceil(usdAmount / price))
}
