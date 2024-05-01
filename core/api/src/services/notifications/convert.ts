import * as Grpc from "./proto/notifications_pb"

import {
  InvalidNotificationCategoryError,
  InvalidPushNotificationSettingError,
  NotificationCategory,
  NotificationChannel,
  DeepLinkScreen,
  DeepLinkAction,
} from "@/domain/notifications"

export const grpcNotificationSettingsToNotificationSettings = (
  settings: Grpc.NotificationSettings | undefined,
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
  category: Grpc.NotificationCategory,
): NotificationCategory | InvalidNotificationCategoryError => {
  switch (category) {
    case Grpc.NotificationCategory.PAYMENTS:
      return NotificationCategory.Payments
    case Grpc.NotificationCategory.PRICE:
      return NotificationCategory.Price
    case Grpc.NotificationCategory.CIRCLES:
      return NotificationCategory.Circles
    case Grpc.NotificationCategory.MARKETING:
      return NotificationCategory.Marketing
    case Grpc.NotificationCategory.ADMIN_NOTIFICATION:
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
): Grpc.NotificationCategory | InvalidNotificationCategoryError => {
  switch (category) {
    case NotificationCategory.Payments:
      return Grpc.NotificationCategory.PAYMENTS
    case NotificationCategory.Circles:
      return Grpc.NotificationCategory.CIRCLES
    case NotificationCategory.Price:
      return Grpc.NotificationCategory.PRICE
    case NotificationCategory.AdminNotification:
      return Grpc.NotificationCategory.ADMIN_NOTIFICATION
    case NotificationCategory.Marketing:
      return Grpc.NotificationCategory.MARKETING
    default:
      return new InvalidNotificationCategoryError(
        `Invalid notification category: ${category}`,
      )
  }
}

export const notificationChannelToGrpcNotificationChannel = (
  channel: NotificationChannel,
): Grpc.NotificationChannel => {
  switch (channel) {
    case NotificationChannel.Push:
      return Grpc.NotificationChannel.PUSH
  }
}

export const deepLinkScreenToGrpcDeepLinkScreen = (
  screen: DeepLinkScreen,
): Grpc.DeepLinkScreen => {
  switch (screen) {
    case DeepLinkScreen.Circles:
      return Grpc.DeepLinkScreen.CIRCLES
    case DeepLinkScreen.Price:
      return Grpc.DeepLinkScreen.PRICE
    case DeepLinkScreen.Earn:
      return Grpc.DeepLinkScreen.EARN
    case DeepLinkScreen.Map:
      return Grpc.DeepLinkScreen.MAP
    case DeepLinkScreen.People:
      return Grpc.DeepLinkScreen.PEOPLE
    case DeepLinkScreen.Home:
      return Grpc.DeepLinkScreen.HOME
    case DeepLinkScreen.Receive:
      return Grpc.DeepLinkScreen.RECEIVE
    case DeepLinkScreen.Convert:
      return Grpc.DeepLinkScreen.CONVERT
    case DeepLinkScreen.ScanQR:
      return Grpc.DeepLinkScreen.SCANQR
    case DeepLinkScreen.Chat:
      return Grpc.DeepLinkScreen.CHAT
    case DeepLinkScreen.Settings:
      return Grpc.DeepLinkScreen.SETTINGS
    case DeepLinkScreen.Settings2FA:
      return Grpc.DeepLinkScreen.SETTINGS2FA
    case DeepLinkScreen.SettingsDisplayCurrency:
      return Grpc.DeepLinkScreen.SETTINGSDISPLAYCURRENCY
    case DeepLinkScreen.SettingsDefaultAccount:
      return Grpc.DeepLinkScreen.SETTINGSDEFAULTACCOUNT
    case DeepLinkScreen.SettingsLanguage:
      return Grpc.DeepLinkScreen.SETTINGSLANGUAGE
    case DeepLinkScreen.SettingsTheme:
      return Grpc.DeepLinkScreen.SETTINGSTHEME
    case DeepLinkScreen.SettingsSecurity:
      return Grpc.DeepLinkScreen.SETTINGSSECURITY
    case DeepLinkScreen.SettingsAccount:
      return Grpc.DeepLinkScreen.SETTINGSACCOUNT
    case DeepLinkScreen.SettingsTxLimits:
      return Grpc.DeepLinkScreen.SETTINGSTXLIMITS
    case DeepLinkScreen.SettingsNotifications:
      return Grpc.DeepLinkScreen.SETTINGSNOTIFICATIONS
    case DeepLinkScreen.SettingsEmail:
      return Grpc.DeepLinkScreen.SETTINGSEMAIL
  }
}

export const deepLinkActionToGrpcDeepLinkAction = (
  action: DeepLinkAction,
): Grpc.DeepLinkAction => {
  switch (action) {
    case DeepLinkAction.SetLnAddressModal:
      return Grpc.DeepLinkAction.SETLNADDRESSMODAL
    case DeepLinkAction.SetDefaultAccountModal:
      return Grpc.DeepLinkAction.SETDEFAULTACCOUNTMODAL
    case DeepLinkAction.UpgradeAccountModal:
      return Grpc.DeepLinkAction.UPGRADEACCOUNTMODAL
  }
}
