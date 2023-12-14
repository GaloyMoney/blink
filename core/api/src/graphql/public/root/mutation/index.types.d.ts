type PaymentAmountPayload<T extends ExchangeCurrencyUnit> = {
  currencyUnit: T
  amount: number
}

type DisplayPricePayload = {
  base: number
  offset: number
}
