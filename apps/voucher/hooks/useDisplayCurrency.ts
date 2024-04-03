import { useCallback, useMemo } from "react"

import { useCurrencyListQuery } from "@/utils/generated/graphql"

const usdDisplayCurrency = {
  symbol: "$",
  id: "USD",
  fractionDigits: 2,
}

const defaultDisplayCurrency = usdDisplayCurrency

const formatCurrencyHelper = ({
  amountInMajorUnits,
  symbol,
  fractionDigits,
  withSign = true,
  withDecimals = true,
}: {
  amountInMajorUnits: number | string
  symbol: string
  fractionDigits: number
  withSign?: boolean
  withDecimals?: boolean
}) => {
  const isNegative = Number(amountInMajorUnits) < 0
  const decimalPlaces = withDecimals ? fractionDigits : 0
  const amountStr = Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(Math.abs(Number(amountInMajorUnits)))
  return `${isNegative && withSign ? "-" : ""}${symbol}${amountStr}`
}

export const useDisplayCurrency = () => {
  const { data: dataCurrencyList, loading } = useCurrencyListQuery({
    context: {
      endpoint: "MAINNET",
    },
  })

  const displayCurrencyDictionary = useMemo(() => {
    const currencyList = dataCurrencyList?.currencyList || []
    return currencyList.reduce(
      (acc, currency) => {
        acc[currency.id] = currency
        return acc
      },
      {} as Record<string, typeof defaultDisplayCurrency>,
    )
  }, [dataCurrencyList?.currencyList])

  const formatCurrency = useCallback(
    ({
      amountInMajorUnits,
      currency,
      withSign,
    }: {
      amountInMajorUnits: number | string
      currency: string
      withSign?: boolean
    }) => {
      const currencyInfo = displayCurrencyDictionary[currency] || {
        symbol: currency,
        fractionDigits: 2,
      }
      return formatCurrencyHelper({
        amountInMajorUnits,
        symbol: currencyInfo.symbol,
        fractionDigits: currencyInfo.fractionDigits,
        withSign,
      })
    },
    [displayCurrencyDictionary],
  )

  return {
    formatCurrency,
    currencyList: dataCurrencyList?.currencyList || [],
    loading,
  }
}
