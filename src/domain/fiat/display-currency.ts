export const toDisplayCurrency =
  (price: UsdPerSat) =>
  (amount: Satoshis): DisplayCurrencyAmount => {
    return (amount * price) as DisplayCurrencyAmount
  }
