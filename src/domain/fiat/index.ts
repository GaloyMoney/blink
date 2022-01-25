import { toSats } from "@domain/bitcoin"
import { InvalidFiatAmount } from "@domain/errors"

export const toFiat = (amount: number): FiatAmount => {
  return amount as FiatAmount
}

export const checkedToFiat = (amount: number): FiatAmount | ValidationError => {
  if (!(amount && amount > 0)) return new InvalidFiatAmount()
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
