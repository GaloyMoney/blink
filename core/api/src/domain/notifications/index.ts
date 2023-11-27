import { InvalidPushNotificationSettingError as InvalidNotificationSettingsError } from "./errors"

export * from "./errors"

export const NotificationType = {
  IntraLedgerReceipt: "intra_ledger_receipt",
  IntraLedgerPayment: "intra_ledger_payment",
  OnchainReceipt: "onchain_receipt",
  OnchainReceiptPending: "onchain_receipt_pending",
  OnchainPayment: "onchain_payment",
  LigtningReceipt: "paid-invoice",
  LigtningPayment: "lightning_payment",
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
  notificationCategory: string,
): NotificationCategory | ValidationError => {
  // TODO: add validation
  if (!notificationCategory) {
    return new InvalidNotificationSettingsError("Invalid notification category")
  }

  return notificationCategory as NotificationCategory
}

export const enableNotificationChannel = ({
  notificationSettings,
  notificationChannel,
}: {
  notificationSettings: NotificationSettings
  notificationChannel: NotificationChannel
}): NotificationSettings => {
  return setNotificationChannelIsEnabled({
    notificationSettings,
    notificationChannel,
    enabled: true,
  })
}

export const disableNotificationChannel = ({
  notificationSettings,
  notificationChannel,
}: {
  notificationSettings: NotificationSettings
  notificationChannel: NotificationChannel
}): NotificationSettings => {
  return setNotificationChannelIsEnabled({
    notificationSettings,
    notificationChannel,
    enabled: false,
  })
}

const setNotificationChannelIsEnabled = ({
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

export const enableNotificationCategory = ({
  notificationSettings,
  notificationChannel,
  notificationCategory,
}: {
  notificationSettings: NotificationSettings
  notificationChannel?: NotificationChannel
  notificationCategory: NotificationCategory
}): NotificationSettings => {
  const notificationChannelsToUpdate: NotificationChannel[] = notificationChannel
    ? [notificationChannel]
    : Object.values(NotificationChannel)

  let newNotificationSettings = notificationSettings

  for (const notificationChannel of notificationChannelsToUpdate) {
    const notificationChannelSettings = notificationSettings[notificationChannel]
    const disabledCategories = notificationChannelSettings.disabledCategories

    const newNotificationChannelSettings = {
      enabled: notificationChannelSettings.enabled,
      disabledCategories: disabledCategories.filter(
        (category) => category !== notificationCategory,
      ),
    }

    newNotificationSettings = {
      ...notificationSettings,
      [notificationChannel]: newNotificationChannelSettings,
    }
  }

  return newNotificationSettings
}

export const disableNotificationCategory = ({
  notificationSettings,
  notificationChannel,
  notificationCategory,
}: {
  notificationSettings: NotificationSettings
  notificationChannel?: NotificationChannel
  notificationCategory: NotificationCategory
}): NotificationSettings => {
  const notificationChannelsToUpdate: NotificationChannel[] = notificationChannel
    ? [notificationChannel]
    : Object.values(NotificationChannel)

  let newNotificationSettings = notificationSettings

  for (const notificationChannel of notificationChannelsToUpdate) {
    const notificationChannelSettings = notificationSettings[notificationChannel]
    const disabledCategories = notificationChannelSettings.disabledCategories
    disabledCategories.push(notificationCategory)
    const uniqueDisabledCategories = [...new Set(disabledCategories)]

    const newNotificationChannelSettings = {
      enabled: notificationChannelSettings.enabled,
      disabledCategories: uniqueDisabledCategories,
    }

    newNotificationSettings = {
      ...notificationSettings,
      [notificationChannel]: newNotificationChannelSettings,
    }
  }

  return newNotificationSettings
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
