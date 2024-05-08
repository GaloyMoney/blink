"use client"

import { ReactNode, createContext, useContext, useEffect, useState } from "react"

import { type Invoice } from "@/components/utils"

import { baseLogger } from "@/lib/logger"
import { useLnInvoicePaymentStatusSubscription } from "@/lib/graphql/generated"

type InvoiceStatus = "PENDING" | "PAID" | "EXPIRED"

const InvoiceStatusContext = createContext<{
  invoice: Invoice | undefined
  status: InvoiceStatus
}>({
  invoice: undefined,
  status: "PENDING",
})

export const InvoiceStatusProvider: React.FC<{
  children: ReactNode
  invoice: Invoice
  initialStatus: InvoiceStatus
}> = (props) => {
  const [invoice] = useState<Invoice>(props.invoice)
  const [status, setStatus] = useState<InvoiceStatus>(props.initialStatus)

  const { data, error } = useLnInvoicePaymentStatusSubscription({
    variables: {
      input: { paymentRequest: props.invoice.paymentRequest || "" },
    },
    skip: !props.invoice.paymentRequest,
  })

  useEffect(() => {
    if (data && data.lnInvoicePaymentStatus.status) {
      setStatus(data.lnInvoicePaymentStatus.status)
    }
  }, [data])

  if (data && error) {
    baseLogger.error(error, "InvoiceStatusProvider subscription error")
  }

  return (
    <InvoiceStatusContext.Provider value={{ invoice, status }}>
      {props.children}
    </InvoiceStatusContext.Provider>
  )
}

export const useInvoiceStatusContext = () => {
  const context = useContext(InvoiceStatusContext)
  if (!context) {
    throw new Error(
      "useInvoiceStatusContext must be used within an InvoiceStatusProvider",
    )
  }
  return context
}
