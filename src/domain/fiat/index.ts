import { toSats } from "@domain/bitcoin"
import { InvalidFiatAmount, NonIntegeterFiatAmount } from "@domain/errors"

export const toFiat = (amount: number): FiatAmount => {
  // safety protection during dev. remove before prod (should not throw)
  if (!Number.isInteger(amount))
    throw new NonIntegeterFiatAmount(`${amount} is not an integer`)
  return amount as FiatAmount
}

export const checkedToFiat = (amount: number): FiatAmount | ValidationError => {
  if (!(amount && amount > 0)) return new InvalidFiatAmount()
  if (Number.isInteger(amount))
    return new NonIntegeterFiatAmount(`${amount} is not an integer`)
  return toFiat(amount)
}

export const satsToFiatOptionPricing = ({
  price,
  fiatAmount,
}: {
  price: UsdPerSat
  fiatAmount: FiatAmount
  // TODO: should we have a currency property? or make FiatAmount subtype per fiat currency?
}) => {
  // TODO: add time value of option
  // TODO: add spread

  return toSats(Math.ceil(fiatAmount / price))
}
