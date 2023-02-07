export const CENTS_PER_USD = 100

export const toDisplayCurrencyBaseAmount = (amount: number) =>
  amount as DisplayCurrencyBaseAmount

export const DisplayCurrencyConverter = (
  realTimePrice: RealTimePrice<DisplayCurrency>,
): DisplayCurrencyConverter => ({
  fromSats: (amount: Satoshis): DisplayCurrencyBaseAmount => {
    return (Number(amount) * realTimePrice.price) as DisplayCurrencyBaseAmount
  },
  fromCents: (amount: UsdCents): DisplayCurrencyBaseAmount => {
    // FIXME: implement where DisplayCurrency is not USD
    return amount as number as DisplayCurrencyBaseAmount
  },

  // TODO: this method should eventually be moved to the dealer
  // the currency assumption is displayCurrency is USD
  fromSatsToCents: (amount: Satoshis): UsdCents => {
    return Math.floor(Number(amount) * (realTimePrice.price * CENTS_PER_USD)) as UsdCents
  },
  fromCentsToSats: (amount: UsdCents): Satoshis => {
    return Math.floor(Number(amount) / (realTimePrice.price * CENTS_PER_USD)) as Satoshis
  },
})

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
