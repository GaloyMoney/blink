"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface CurrencyContextProps {
  currency: string
  changeCurrency: (newCurrency: string) => void
}

const defaultCurrencyState: CurrencyContextProps = {
  currency: "USD",
  changeCurrency: (newCurrency: string) => {
    console.log(newCurrency)
  },
}

const CurrencyContext = createContext<CurrencyContextProps>(defaultCurrencyState)

interface CurrencyProviderProps {
  children: ReactNode
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
  const [currency, setCurrency] = useState("USD")

  useEffect(() => {
    const storedCurrency = localStorage.getItem("currency")
    if (storedCurrency) {
      setCurrency(storedCurrency)
    }
  }, [])

  const changeCurrency = (newCurrency: string) => {
    setCurrency(newCurrency)
    localStorage.setItem("currency", newCurrency)
  }

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
