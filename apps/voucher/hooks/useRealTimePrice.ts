import React, { useState, useEffect } from "react"

import { gql, SubscriptionResult } from "@apollo/client"

import { useDisplayCurrency } from "./useDisplayCurrency"

import {
  RealtimePriceWsSubscription,
  useRealtimePriceInitialQuery,
  useRealtimePriceWsSubscription,
} from "@/lib/graphql/generated"

interface Currency {
  __typename: string
  id: string
  symbol: string
  name: string
  flag: string
  fractionDigits: number
}

gql`
  query RealtimePriceInitial($currency: DisplayCurrency!) {
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
`

const useRealtimePrice = (
  currency: string,
  onSubscriptionDataCallback?: (
    subscriptionData: SubscriptionResult<RealtimePriceWsSubscription, any>,
  ) => void,
) => {
  const priceRef = React.useRef<{ sats: number; cent: number }>({
    sats: 0,
    cent: 0,
  })
  const { formatCurrency } = useDisplayCurrency()
  const hasLoaded = React.useRef<boolean>(false)

  const { data } = useRealtimePriceWsSubscription({
    variables: { currency },
    onSubscriptionData({ subscriptionData }) {
      if (onSubscriptionDataCallback) onSubscriptionDataCallback(subscriptionData)
    },
    context: {
      endpoint: "GALOY",
    },
  })

  const { data: initialData } = useRealtimePriceInitialQuery({
    variables: { currency },
    onCompleted(initData) {
      if (initData?.realtimePrice?.btcSatPrice) {
        const { base, offset } = initData.realtimePrice.btcSatPrice
        priceRef.current.sats = base / 10 ** offset
      }
      if (initData?.realtimePrice?.usdCentPrice) {
        const { base: base_cent, offset: offset_cent } =
          initData.realtimePrice.usdCentPrice
        priceRef.current.cent = base_cent / 10 ** offset_cent
      }
    },
    context: {
      endpoint: "GALOY",
    },
  })
  React.useEffect(() => {
    if ((data || initialData) && !hasLoaded.current) {
      hasLoaded.current = true
    }
  }, [data, initialData])

  const conversions = React.useMemo(
    () => ({
      satsToCurrency: (sats: number, display: string, fractionDigits: number) => {
        const convertedCurrencyAmount =
          fractionDigits === 2
            ? (sats * priceRef.current.sats) / 100
            : sats * priceRef.current.sats
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
            ? (100 * currency) / priceRef.current.sats
            : currency / priceRef.current.sats
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
      currencyToCents: (currency: number, display: string, fractionDigits: number) => {
        const convertedCurrencyAmount =
          fractionDigits === 2
            ? (100 * currency) / priceRef.current.cent
            : currency / priceRef.current.cent
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
      centsToCurrency: (cent: number, display: string, fractionDigits: number) => {
        const convertedCurrencyAmount =
          fractionDigits === 2
            ? (cent * priceRef.current.cent) / 100
            : cent * priceRef.current.cent
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
    priceRef.current.sats = base / 10 ** offset
  }
  if (data?.realtimePrice?.realtimePrice?.usdCentPrice) {
    const { base, offset } = data.realtimePrice.realtimePrice.usdCentPrice
    priceRef.current.cent = base / 10 ** offset
  }

  if (priceRef.current.sats === 0 || priceRef.current.cent === 0) {
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
      currencyToCents: () => {
        return {
          convertedCurrencyAmount: NaN,
          formattedCurrency: "0",
        }
      },
      centsToCurrency: () => {
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
