import { NotImplementedError } from "@domain/errors"

export const toDisplayCurrencyBaseAmount = (amount: number) =>
  amount as DisplayCurrencyBaseAmount

export const DisplayCurrencyConversionRate = (
  price: UsdPerSat,
): DisplayCurrencyConversionRate => ({
  fromSats: (amount: Satoshis): DisplayCurrencyBaseAmount => {
    return (Number(amount) * price) as DisplayCurrencyBaseAmount
  },
  fromCents: (amount: UsdCents): DisplayCurrencyBaseAmount => {
    throw new NotImplementedError("DisplayCurrencyConversionRate.fromCents")
    return (Number(amount) * price) as DisplayCurrencyBaseAmount
  },
})
