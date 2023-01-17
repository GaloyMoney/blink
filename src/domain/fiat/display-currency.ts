import { DisplayCurrency } from "."

export const CENTS_PER_USD = 100

export const toDisplayCurrencyBaseAmount = (amount: number) =>
  amount as DisplayCurrencyBaseAmount

export const CurrencyConverter = (price: DisplayCurrencyPerSat): CurrencyConverter => ({
  // TODO: this method should eventually be moved to the dealer
  // the currency assumption is displayCurrency is USD
  fromSatsToCents: (amount: Satoshis): UsdCents => {
    return Math.floor(Number(amount) * (price * CENTS_PER_USD)) as UsdCents
  },
  fromCentsToSats: (amount: UsdCents): Satoshis => {
    return Math.floor(Number(amount) / (price * CENTS_PER_USD)) as Satoshis
  },
})

export const DisplayCurrencyConverter = ({
  currency,
  getPriceFn,
}: {
  currency: DisplayCurrency
  getPriceFn: GetPriceFn
}): DisplayCurrencyConverter => {
  return {
    fromBtcAmount: async ({
      amount,
    }: BtcPaymentAmount): Promise<DisplayCurrencyBaseAmount | Error> => {
      const price = await getPriceFn({ currency })
      if (price instanceof Error) return price
      return (Number(amount) * price) as DisplayCurrencyBaseAmount
    },
    fromUsdAmount: async ({
      amount,
    }: UsdPaymentAmount): Promise<DisplayCurrencyBaseAmount | Error> => {
      const usdBtcPrice = await getPriceFn({ currency: DisplayCurrency.Usd })
      if (usdBtcPrice instanceof Error) return usdBtcPrice

      const price = await getPriceFn({ currency })
      if (price instanceof Error) return price
      return ((Number(amount) * price) / usdBtcPrice) as DisplayCurrencyBaseAmount
    },
  }
}
