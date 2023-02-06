export const CENTS_PER_USD = 100

export const usdMinorToMajorUnit = (amount: number | bigint) =>
  Number((Number(amount) / CENTS_PER_USD).toFixed(2))

export const toDisplayCurrencyBaseAmount = (amount: number) =>
  amount as DisplayCurrencyBaseAmount

export const NewDisplayCurrencyConverter = (
  displayCurrencyPrice: DisplayCurrencyBasePerSat,
): NewDisplayCurrencyConverter => {
  return {
    fromBtcAmount: (btc: BtcPaymentAmount): DisplayCurrencyBaseAmount =>
      (Number(btc.amount) * displayCurrencyPrice) as DisplayCurrencyBaseAmount,
    fromUsdAmount: (usd: UsdPaymentAmount): DisplayCurrencyBaseAmount =>
      Number(usd.amount) as DisplayCurrencyBaseAmount,
  }
}
