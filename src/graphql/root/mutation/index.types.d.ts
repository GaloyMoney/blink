type PaymentAmountPayload<T extends ExchangeCurrencyUnit> = {
  currencyUnit: T
  amount: number
}
