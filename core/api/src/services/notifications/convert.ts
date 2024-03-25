import {
  NotificationSettings as GrpcNotificationSettings,
  NotificationCategory as GrpcNotificationCategory,
  NotificationChannel as GrpcNotificationChannel,
} from "./proto/notifications_pb"

import {
  InvalidNotificationCategoryError,
  InvalidPushNotificationSettingError,
  NotificationCategory,
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
): NotificationCategory | InvalidNotificationCategoryError => {
  switch (category) {
    case GrpcNotificationCategory.PAYMENTS:
      return NotificationCategory.Payments
    case GrpcNotificationCategory.PRICE:
      return NotificationCategory.Price
    case GrpcNotificationCategory.CIRCLES:
      return NotificationCategory.Circles
    case GrpcNotificationCategory.BALANCE:
      return NotificationCategory.Balance
    case GrpcNotificationCategory.ADMIN_NOTIFICATION:
      return NotificationCategory.AdminNotification
    default:
      return new InvalidNotificationCategoryError(
        `Invalid notification category: ${category}`,
      )
  }
}

// TODO: Add support for AdminPushNotification and Balance to Notifications pod
export const notificationCategoryToGrpcNotificationCategory = (
  category: NotificationCategory,
): GrpcNotificationCategory | InvalidNotificationCategoryError => {
  switch (category) {
    case NotificationCategory.Payments:
      return GrpcNotificationCategory.PAYMENTS
    case NotificationCategory.Circles:
      return GrpcNotificationCategory.CIRCLES
    case NotificationCategory.Price:
      return GrpcNotificationCategory.PRICE
    case NotificationCategory.AdminNotification:
      return GrpcNotificationCategory.ADMIN_NOTIFICATION
    case NotificationCategory.Balance:
      return GrpcNotificationCategory.BALANCE
    case NotificationCategory.Marketing:
      return GrpcNotificationCategory.MARKETING
    default:
      return new InvalidNotificationCategoryError(
        `Invalid notification category: ${category}`,
      )
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
