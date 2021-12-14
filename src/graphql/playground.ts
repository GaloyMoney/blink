const defaultQuery = `query btcPriceList($range: PriceGraphRange!) {
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

const defaultQueryName = "btcPriceList (Sample Query)"

const defaultQueryVars = '{"range": "ONE_DAY"}'

export { defaultQuery, defaultQueryName, defaultQueryVars }
