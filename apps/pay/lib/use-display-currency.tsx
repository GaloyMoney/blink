import { gql } from "@apollo/client"
import { useCurrencyListQuery } from "./graphql/generated"
import { useCallback, useMemo } from "react"

gql`
  query currencyList {
    currencyList {
      __typename
      id
      flag
      name
      symbol
      fractionDigits
    }
  }
`

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
    // FIXME this workaround of using .format and not .formatNumber is
    // because hermes haven't fully implemented Intl.NumberFormat yet
  }).format(Math.abs(Number(amountInMajorUnits)))
  return `${isNegative && withSign ? "-" : ""}${symbol}${amountStr}`
}

export const useDisplayCurrency = () => {
  const { data: dataCurrencyList } = useCurrencyListQuery({})

  const displayCurrencyDictionary = useMemo(() => {
    const currencyList = dataCurrencyList?.currencyList || []
    return currencyList.reduce((acc, currency) => {
      acc[currency.id] = currency
      return acc
    }, {} as Record<string, typeof defaultDisplayCurrency>)
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
  }
}
