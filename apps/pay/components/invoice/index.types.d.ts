import { type Invoice } from "../utils"

export type InvoiceProps = {
  title: string
  paymentRequest: string
  status: string
  returnUrl: string | null
}

export type CancelInvoiceButtonProps = {
  returnUrl: string | null
}

export type ReceiptProps = {
  invoice: Invoice
  amount?: number | undefined
  currency?: string | undefined
  status: string | undefined
}
