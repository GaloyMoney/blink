import { type Invoice } from "../utils"

export type InvoiceProps = {
  title: string
  returnUrl: string | null
}

export type ReturnInvoiceButtonProps = {
  returnUrl: string | null
  type: "primary" | "secondary"
  children: React.ReactNode
}

export type ExpirationLabelProps = {
  expirationDate: number
}

export type StatusActionsProps = {
  returnUrl: string | null
}

export type ReceiptProps = {
  invoice: Invoice
  amount?: number | undefined
  currency?: string | undefined
  status: string | undefined
}
