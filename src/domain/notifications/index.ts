export * from "./errors"

export const NotificationType = {
  OnchainReceipt: "onchain_receipt",
  OnchainReceiptPending: "onchain_receipt_pending",
  OnchainPayment: "onchain_payment",
  LnInvoicePaid: "paid-invoice",
} as const
