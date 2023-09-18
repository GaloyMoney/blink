import { InvalidPushNotificationSettingError as InvalidNotificationSettingsError } from "./errors"

export * from "./errors"

export const NotificationType = {
  IntraLedgerReceipt: "intra_ledger_receipt",
  IntraLedgerPayment: "intra_ledger_payment",
  OnchainReceipt: "onchain_receipt",
  OnchainReceiptPending: "onchain_receipt_pending",
  OnchainPayment: "onchain_payment",
  LnInvoicePaid: "paid-invoice",
} as const

export const NotificationChannel = {
  Push: "push",
} as const

export const GaloyNotificationCategories = {
  Payments: "Payments" as NotificationCategory,
  Balance: "Balance" as NotificationCategory,
  AdminPushNotification: "AdminPushNotification" as NotificationCategory,
} as const

export const checkedToNotificationCategory = (
  type: string,
): NotificationCategory | ValidationError => {
  // TODO: add validation
  if (!type) {
    return new InvalidNotificationSettingsError("Invalid notification category")
  }

  return type as NotificationCategory
}

export const setNotificationChannelIsEnabled = ({
  notificationSettings,
  notificationChannel,
  enabled,
}: {
  notificationSettings: NotificationSettings
  notificationChannel: NotificationChannel
  enabled: boolean
}): NotificationSettings => {
  const notificationChannelSettings = notificationSettings[notificationChannel]
  const enabledChanged = notificationChannelSettings.enabled !== enabled

  const newNotificationSettings = {
    enabled,
    disabledCategories: enabledChanged
      ? []
      : notificationChannelSettings.disabledCategories,
  }

  return {
    ...notificationSettings,
    [notificationChannel]: newNotificationSettings,
  }
}

export const enableNotificationCategoryForChannel = ({
  notificationSettings,
  notificationChannel,
  notificationCategory,
}: {
  notificationSettings: NotificationSettings
  notificationChannel: NotificationChannel
  notificationCategory: NotificationCategory
}): NotificationSettings => {
  const notificationChannelSettings = notificationSettings[notificationChannel]
  const disabledCategories = notificationChannelSettings.disabledCategories

  const newNotificationSettings = {
    enabled: notificationChannelSettings.enabled,
    disabledCategories: disabledCategories.filter(
      (category) => category !== notificationCategory,
    ),
  }

  return {
    ...notificationSettings,
    [notificationChannel]: newNotificationSettings,
  }
}

export const disableNotificationCategoryForChannel = ({
  notificationSettings,
  notificationChannel,
  notificationCategory,
}: {
  notificationSettings: NotificationSettings
  notificationChannel: NotificationChannel
  notificationCategory: NotificationCategory
}): NotificationSettings => {
  const notificationChannelSettings = notificationSettings[notificationChannel]
  const disabledCategories = notificationChannelSettings.disabledCategories
  disabledCategories.push(notificationCategory)
  const uniqueDisabledCategories = [...new Set(disabledCategories)]

  const newNotificationSettings = {
    enabled: notificationChannelSettings.enabled,
    disabledCategories: uniqueDisabledCategories,
  }

  return {
    ...notificationSettings,
    [notificationChannel]: newNotificationSettings,
  }
}

export const shouldSendNotification = ({
  notificationChannel,
  notificationSettings,
  notificationCategory,
}: {
  notificationChannel: NotificationChannel
  notificationSettings: NotificationSettings
  notificationCategory: NotificationCategory
}): boolean => {
  const channelNotificationSettings = notificationSettings[notificationChannel]

  if (channelNotificationSettings.enabled) {
    return !channelNotificationSettings.disabledCategories.includes(notificationCategory)
  }

  return false
}
