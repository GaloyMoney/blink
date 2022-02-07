export const toDisplayCurrencyBaseAmount = (amount: number) =>
  amount as DisplayCurrencyBaseAmount

export const DisplayCurrencyConversionRate = (
  price: DisplayCurrencyPerSat,
): DisplayCurrencyConversionRate => ({
  fromSats: (amount: Satoshis): DisplayCurrencyBaseAmount => {
    return (Number(amount) * price) as DisplayCurrencyBaseAmount
  },
  fromCents: (amount: UsdCents): DisplayCurrencyBaseAmount => {
    // FIXME: implement where DisplayCurrency is not USD
    return amount as number as DisplayCurrencyBaseAmount
  },
})
