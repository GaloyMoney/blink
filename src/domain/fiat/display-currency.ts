export const toDisplayCurrencyBaseAmount = (amount: number) =>
  amount as DisplayCurrencyBaseAmount

export const DisplayCurrencyConversionRate = (price: UsdPerSat) => ({
  fromSats: (amount: Satoshis): DisplayCurrencyBaseAmount => {
    return (amount * price) as DisplayCurrencyBaseAmount
  },
})
