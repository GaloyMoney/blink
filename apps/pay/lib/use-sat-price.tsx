import { gql, useSubscription } from "@apollo/client"
import * as React from "react"

const QUERY_PRICE = gql`
  subscription price(
    $amount: SatAmount!
    $amountCurrencyUnit: ExchangeCurrencyUnit!
    $priceCurrencyUnit: ExchangeCurrencyUnit!
  ) {
    price(
      input: {
        amount: $amount
        amountCurrencyUnit: $amountCurrencyUnit
        priceCurrencyUnit: $priceCurrencyUnit
      }
    ) {
      errors {
        message
      }
      price {
        base
        offset
        currencyUnit
        formattedAmount
      }
    }
  }
`

const useSatPrice = () => {
  const priceRef = React.useRef<number>(0)

  const { data } = useSubscription(QUERY_PRICE, {
    variables: {
      amount: 1,
      amountCurrencyUnit: "BTCSAT",
      priceCurrencyUnit: "USDCENT",
    },
  })

  const conversions = React.useMemo(
    () => ({
      satsToUsd: (sats: number) => (sats * priceRef.current) / 100,
      usdToSats: (usd: number) => (100 * usd) / priceRef.current,
    }),
    [],
  )

  if (data?.price?.price) {
    const { base, offset } = data.price.price
    priceRef.current = base / 10 ** offset
  }

  if (priceRef.current === 0) {
    return {
      satsToUsd: () => NaN,
      usdToSats: () => NaN,
    }
  }

  return conversions
}

export default useSatPrice
