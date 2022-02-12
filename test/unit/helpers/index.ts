export const dCConverter = {
  fromSats: (amount: Satoshis) => Number(amount * 2) as DisplayCurrencyBaseAmount,
  fromCents: (amount: UsdCents) => Number(amount * 20) as DisplayCurrencyBaseAmount,

  // FIXME: move fromSatsToCents to Dealer
  // Math doesn't work between DisplayCurrencyBaseAmount and UsdCents
  // so do not use fromSatsToCents for any Math related test
  fromSatsToCents: (amount: Satoshis) => Math.floor(amount * 2) as UsdCents,
  fromCentsToSats: (amount: UsdCents) => Math.floor(amount / 2) as Satoshis,
}
