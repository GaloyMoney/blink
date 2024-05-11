"use client"
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react"

import { useDisplayCurrency } from "@/hooks/useDisplayCurrency"

type CurrencyContextProps = {
  currency: string
  changeCurrency: (newCurrency: string) => void
  currencyList: { id: string; name: string }[]
}

const defaultCurrencyState: CurrencyContextProps = {
  currency: "USD",
  changeCurrency: (newCurrency: string) => {
    console.log(newCurrency)
  },
  currencyList: [],
}

const CurrencyContext = createContext<CurrencyContextProps>(defaultCurrencyState)

interface CurrencyProviderProps {
  children: ReactNode
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
  const [currency, setCurrency] = useState("USD")
  const { currencyList } = useDisplayCurrency()

  useEffect(() => {
    const storedCurrency = localStorage.getItem("currency")
    if (storedCurrency && currencyList.some((c) => c.id === storedCurrency)) {
      setCurrency(storedCurrency)
    }
  }, [currencyList])

  const changeCurrency = useCallback(
    (newCurrency: string) => {
      if (currencyList.some((c) => c.id === newCurrency)) {
        setCurrency(newCurrency)
        localStorage.setItem("currency", newCurrency)
      }
    },
    [currencyList],
  )

  const providerValue = useMemo(
    () => ({
      currency,
      changeCurrency,
      currencyList,
    }),
    [currency, currencyList, changeCurrency],
  )

  return (
    <CurrencyContext.Provider value={providerValue}>{children}</CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
