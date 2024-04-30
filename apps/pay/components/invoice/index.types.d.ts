export type InvoiceProps = {
  title: string
  paymentRequest: string
  status: string
  returnUrl: string | null
}

export type CancelInvoiceButtonProps = {
  returnUrl: string | null
}
