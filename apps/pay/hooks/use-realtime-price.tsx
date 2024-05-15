import { gql, SubscriptionResult } from "@apollo/client"
import * as React from "react"

import {
  RealtimePriceWsSubscription,
  useRealtimePriceInitialQuery,
  useRealtimePriceWsSubscription,
} from "@/lib/graphql/generated"
import { useDisplayCurrency } from "@/hooks/use-display-currency"

gql`
  subscription realtimePriceWs($currency: DisplayCurrency!) {
    realtimePrice(input: { currency: $currency }) {
      errors {
        message
      }
      realtimePrice {
        timestamp
        btcSatPrice {
          base
          offset
        }
        usdCentPrice {
          base
          offset
        }
        denominatorCurrency
      }
    }
  }

  query realtimePriceInitial($currency: DisplayCurrency!) {
    realtimePrice(currency: $currency) {
      timestamp
      btcSatPrice {
        base
        offset
      }
      usdCentPrice {
        base
        offset
      }
      denominatorCurrency
    }
  }
`

const useRealtimePrice = (
  currency: string,
  onSubscriptionDataCallback?: (
    subscriptionData: SubscriptionResult<RealtimePriceWsSubscription, unknown>,
  ) => void,
) => {
  const priceRef = React.useRef<number>(0)
  const { formatCurrency } = useDisplayCurrency()
  const hasLoaded = React.useRef<boolean>(false)

  const { data } = useRealtimePriceWsSubscription({
    variables: { currency },
    onSubscriptionData({ subscriptionData }) {
      if (onSubscriptionDataCallback) onSubscriptionDataCallback(subscriptionData)
    },
  })

  const { data: initialData } = useRealtimePriceInitialQuery({
    variables: { currency },
    onCompleted(initData) {
      if (initData?.realtimePrice?.btcSatPrice) {
        const { base, offset } = initData.realtimePrice.btcSatPrice
        priceRef.current = base / 10 ** offset
      }
    },
  })

  React.useEffect(() => {
    if ((data || initialData) && !hasLoaded.current) {
      // Subscription data or graphql data has loaded for the first time
      hasLoaded.current = true
    }
  }, [data, initialData])

  const conversions = React.useMemo(
    () => ({
      satsToCurrency: (sats: number, display: string, fractionDigits: number) => {
        const convertedCurrencyAmount =
          fractionDigits === 2 ? (sats * priceRef.current) / 100 : sats * priceRef.current
        const formattedCurrency = formatCurrency({
          amountInMajorUnits: convertedCurrencyAmount,
          currency: display,
          withSign: true,
        })
        return {
          convertedCurrencyAmount,
          formattedCurrency,
        }
      },
      currencyToSats: (currency: number, display: string, fractionDigits: number) => {
        const convertedCurrencyAmount =
          fractionDigits === 2
            ? (100 * currency) / priceRef.current
            : currency / priceRef.current
        const formattedCurrency = formatCurrency({
          amountInMajorUnits: convertedCurrencyAmount,
          currency: display,
          withSign: true,
        })
        return {
          convertedCurrencyAmount,
          formattedCurrency,
        }
      },
      hasLoaded: hasLoaded,
    }),
    [priceRef, formatCurrency],
  )

  if (data?.realtimePrice?.realtimePrice?.btcSatPrice) {
    const { base, offset } = data.realtimePrice.realtimePrice.btcSatPrice
    priceRef.current = base / 10 ** offset
  }

  if (priceRef.current === 0) {
    return {
      satsToCurrency: () => {
        return {
          convertedCurrencyAmount: NaN,
          formattedCurrency: "0",
        }
      },
      currencyToSats: () => {
        return {
          convertedCurrencyAmount: NaN,
          formattedCurrency: "0",
        }
      },
      hasLoaded: hasLoaded,
    }
  }

  return conversions
}
export default useRealtimePrice
