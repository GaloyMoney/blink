"use client"
import React, { createContext, useContext, useReducer, ReactNode } from "react"

import reducer, { ACTION_TYPE, InvoiceState } from "@/app/reducer"
import { defaultCurrencyMetadata } from "@/app/currency-metadata"

const InvoiceContext = createContext<{
  state: InvoiceState
  dispatch: React.Dispatch<ACTION_TYPE>
}>({
  state: {
    currentAmount: "0",
    username: "",
    walletCurrency: "",
    walletId: "",
    createdInvoice: false,
    pinnedToHomeScreenModalVisible: false,
    memo: "",
    displayCurrencyMetaData: defaultCurrencyMetadata,
  },
  dispatch: () => null,
})

export const InvoiceProvider: React.FC<{
  children: ReactNode
  initialState: InvoiceState
}> = ({ children, initialState }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <InvoiceContext.Provider value={{ state, dispatch }}>
      {children}
    </InvoiceContext.Provider>
  )
}

export const useInvoiceContext = () => {
  const context = useContext(InvoiceContext)
  if (context === undefined) {
    throw new Error("useInvoiceContext must be used within an InvoiceProvider")
  }
  return context
}
