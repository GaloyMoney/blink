export const DisplayCurrencyConversionRate =
  (price: UsdPerSat) =>
  (amount: Satoshis): DisplayCurrencyBaseAmount => {
    return (amount * price) as DisplayCurrencyBaseAmount
  }
