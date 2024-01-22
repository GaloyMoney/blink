import {
  NotificationSettings as GrpcNotificationSettings,
  NotificationCategory as GrpcNotificationCategory,
  NotificationChannel as GrpcNotificationChannel,
} from "./proto/notifications_pb"

import {
  GaloyNotificationCategories,
  InvalidPushNotificationSettingError,
  NotificationChannel,
} from "@/domain/notifications"

export const grpcNotificationSettingsToNotificationSettings = (
  settings: GrpcNotificationSettings | undefined,
): NotificationSettings | InvalidPushNotificationSettingError => {
  if (!settings) return new InvalidPushNotificationSettingError("No settings provided")

  const pushSettings = settings.getPush()
  if (!pushSettings)
    return new InvalidPushNotificationSettingError("No push settings provided")

  const disabledCategories = pushSettings
    .getDisabledCategoriesList()
    .map(grpcNotificationCategoryToNotificationCategory)
    .filter(
      (category): category is NotificationCategory =>
        !(category instanceof InvalidPushNotificationSettingError),
    )

  const notificationSettings: NotificationSettings = {
    language: (settings.getLocale() || "") as UserLanguageOrEmpty,
    push: {
      enabled: pushSettings.getEnabled(),
      disabledCategories,
    },
    pushDeviceTokens: settings.getPushDeviceTokensList() as DeviceToken[],
  }

  return notificationSettings
}

export const grpcNotificationCategoryToNotificationCategory = (
  category: GrpcNotificationCategory,
): NotificationCategory | InvalidPushNotificationSettingError => {
  switch (category) {
    case GrpcNotificationCategory.PAYMENTS:
      return GaloyNotificationCategories.Payments
    case GrpcNotificationCategory.CIRCLES:
      return "Circles" as NotificationCategory
    case GrpcNotificationCategory.BALANCE:
      return GaloyNotificationCategories.Balance
    case GrpcNotificationCategory.ADMIN_NOTIFICATION:
      return GaloyNotificationCategories.AdminNotification
    default:
      return new InvalidPushNotificationSettingError(
        `Invalid notification category: ${category}`,
      )
  }
}

// TODO: Add support for AdminPushNotification and Balance to Notifications pod
export const notificationCategoryToGrpcNotificationCategory = (
  category: NotificationCategory,
): GrpcNotificationCategory => {
  switch (category) {
    case GaloyNotificationCategories.Payments:
      return GrpcNotificationCategory.PAYMENTS
    case "Circles":
      return GrpcNotificationCategory.CIRCLES
    case GaloyNotificationCategories.AdminNotification:
      return GrpcNotificationCategory.ADMIN_NOTIFICATION
    case GaloyNotificationCategories.Balance:
      return GrpcNotificationCategory.BALANCE
    default:
      throw new Error(`Not implemented: ${category}`)
  }
}

export const notificationChannelToGrpcNotificationChannel = (
  channel: NotificationChannel,
): GrpcNotificationChannel => {
  switch (channel) {
    case NotificationChannel.Push:
      return GrpcNotificationChannel.PUSH
  }
}
