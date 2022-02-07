export const toDisplayCurrencyBaseAmount = (amount: number) =>
  amount as DisplayCurrencyBaseAmount

export const DisplayCurrencyConversionRate = (price: SatPerUsd) => ({
  fromSats: (amount: Satoshis): DisplayCurrencyBaseAmount => {
    return (amount * price) as DisplayCurrencyBaseAmount
  },
})
