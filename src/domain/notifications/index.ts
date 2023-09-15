import { InvalidPushNotificationSettingError } from "./errors"

export * from "./errors"

export const NotificationType = {
  IntraLedgerReceipt: "intra_ledger_receipt",
  IntraLedgerPayment: "intra_ledger_payment",
  OnchainReceipt: "onchain_receipt",
  OnchainReceiptPending: "onchain_receipt_pending",
  OnchainPayment: "onchain_payment",
  LnInvoicePaid: "paid-invoice",
} as const

export const checkedToPushNotificationSettings = ({
  disabledPushNotificationTypes,
  pushNotificationsEnabled,
}: {
  disabledPushNotificationTypes: string[]
  pushNotificationsEnabled: boolean
}): PushNotificationSettings | InvalidPushNotificationSettingError => {
  const checkedDisabledPushNotificationTypes: PushNotificationType[] = []

  for (const pushNotification of disabledPushNotificationTypes) {
    const checkedPushNotification = checkedToPushNotificationType(pushNotification)
    if (checkedPushNotification instanceof Error) {
      return checkedPushNotification
    } else {
      checkedDisabledPushNotificationTypes.push(checkedPushNotification)
    }
  }

  return {
    pushNotificationsEnabled,
    disabledPushNotificationTypes: checkedDisabledPushNotificationTypes,
  }
}

export const GaloyPushNotifications = {
  Payments: "Payments" as PushNotificationType,
  Balance: "Balance" as PushNotificationType,
} as const

export const mapNotificationTypeToPushNotificationType = (
  notificationType: NotificationType,
): PushNotificationType => {
  switch (notificationType) {
    case NotificationType.IntraLedgerReceipt:
    case NotificationType.IntraLedgerPayment:
    case NotificationType.OnchainReceipt:
    case NotificationType.OnchainReceiptPending:
    case NotificationType.LnInvoicePaid:
    case NotificationType.OnchainPayment:
      return GaloyPushNotifications.Payments
  }
}

const checkedToPushNotificationType = (
  type: string,
): PushNotificationType | ValidationError => {
  // TODO: add validation
  if (!type) {
    return new InvalidPushNotificationSettingError("Invalid notification type")
  }

  return type as PushNotificationType
}

export const shouldSendPushNotification = ({
  pushNotificationSettings,
  pushNotificationType,
}: {
  pushNotificationSettings: PushNotificationSettings
  pushNotificationType: PushNotificationType
}): boolean => {
  if (pushNotificationSettings.pushNotificationsEnabled) {
    return !pushNotificationSettings.disabledPushNotificationTypes.includes(
      pushNotificationType,
    )
  }

  return false
}
