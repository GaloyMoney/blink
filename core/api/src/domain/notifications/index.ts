export * from "./errors"
import { InvalidPushNotificationSettingError } from "./errors"

export const NotificationType = {
  IntraLedgerReceipt: "intra_ledger_receipt",
  IntraLedgerPayment: "intra_ledger_payment",
  OnchainReceipt: "onchain_receipt",
  OnchainReceiptPending: "onchain_receipt_pending",
  OnchainPayment: "onchain_payment",
  LigtningReceipt: "paid-invoice",
  LigtningPayment: "lightning_payment",
} as const

export const checkedToNotificationCategory = (
  notificationCategory: string,
): NotificationCategory | ValidationError => {
  // TODO: add validation
  if (!notificationCategory) {
    return new InvalidPushNotificationSettingError("Invalid notification category")
  }

  return notificationCategory as NotificationCategory
}

export const NotificationChannel = {
  Push: "push",
} as const

export const GaloyNotificationCategories = {
  Payments: "Payments" as NotificationCategory,
  Balance: "Balance" as NotificationCategory,
  AdminPushNotification: "AdminPushNotification" as NotificationCategory,
} as const
