export const BTC_PRICE_QUERY = `query btcPriceList($range: PriceGraphRange!) {
  btcPriceList(range: $range) {
      timestamp
      price {
      base
      offset
      currencyUnit
      formattedAmount
    }
  }
}`

export const playgroundTabs = {
  default: {
    query: BTC_PRICE_QUERY,
    name: "btcPriceList (Sample Query)",
    variables: JSON.stringify({ range: "ONE_DAY" }),
  },
}
