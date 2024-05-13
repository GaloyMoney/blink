import * as Grpc from "./proto/notifications_pb"

import {
  InvalidNotificationCategoryError,
  InvalidPushNotificationSettingError,
  NotificationCategory,
  NotificationChannel,
  DeepLinkScreen,
  DeepLinkAction,
  Icon,
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

export const iconToGrpcIcon = (icon: Icon): Grpc.Icon => {
  switch (icon) {
    case Icon.ArrowLeft:
      return Grpc.Icon.ARROWLEFT
    case Icon.ArrowRight:
      return Grpc.Icon.ARROWRIGHT
    case Icon.BackSpace:
      return Grpc.Icon.BACKSPACE
    case Icon.Bell:
      return Grpc.Icon.BELL
    case Icon.Bank:
      return Grpc.Icon.BANK
    case Icon.Bitcoin:
      return Grpc.Icon.BITCOIN
    case Icon.Book:
      return Grpc.Icon.BOOK
    case Icon.BtcBook:
      return Grpc.Icon.BTCBOOK
    case Icon.CaretDown:
      return Grpc.Icon.CARETDOWN
    case Icon.CaretLeft:
      return Grpc.Icon.CARETLEFT
    case Icon.CaretRight:
      return Grpc.Icon.CARETRIGHT
    case Icon.CaretUp:
      return Grpc.Icon.CARETUP
    case Icon.CheckCircle:
      return Grpc.Icon.CHECKCIRCLE
    case Icon.Check:
      return Grpc.Icon.CHECK
    case Icon.Close:
      return Grpc.Icon.CLOSE
    case Icon.CloseCrossWithBackground:
      return Grpc.Icon.CLOSECROSSWITHBACKGROUND
    case Icon.Coins:
      return Grpc.Icon.COINS
    case Icon.People:
      return Grpc.Icon.PEOPLEICON
    case Icon.CopyPaste:
      return Grpc.Icon.COPYPASTE
    case Icon.Dollar:
      return Grpc.Icon.DOLLAR
    case Icon.EyeSlash:
      return Grpc.Icon.EYESLASH
    case Icon.Eye:
      return Grpc.Icon.EYE
    case Icon.Filter:
      return Grpc.Icon.FILTER
    case Icon.Globe:
      return Grpc.Icon.GLOBE
    case Icon.Graph:
      return Grpc.Icon.GRAPH
    case Icon.Image:
      return Grpc.Icon.IMAGE
    case Icon.Info:
      return Grpc.Icon.INFO
    case Icon.Lightning:
      return Grpc.Icon.LIGHTNING
    case Icon.Link:
      return Grpc.Icon.LINK
    case Icon.Loading:
      return Grpc.Icon.LOADING
    case Icon.MagnifyingGlass:
      return Grpc.Icon.MAGNIFYINGGLASS
    case Icon.Map:
      return Grpc.Icon.MAPICON
    case Icon.Menu:
      return Grpc.Icon.MENU
    case Icon.Pencil:
      return Grpc.Icon.PENCIL
    case Icon.Note:
      return Grpc.Icon.NOTE
    case Icon.Rank:
      return Grpc.Icon.RANK
    case Icon.QrCode:
      return Grpc.Icon.QRCODE
    case Icon.Question:
      return Grpc.Icon.QUESTION
    case Icon.Receive:
      return Grpc.Icon.RECEIVEICON
    case Icon.Send:
      return Grpc.Icon.SEND
    case Icon.Settings:
      return Grpc.Icon.SETTINGSICON
    case Icon.Share:
      return Grpc.Icon.SHARE
    case Icon.Transfer:
      return Grpc.Icon.TRANSFER
    case Icon.User:
      return Grpc.Icon.USER
    case Icon.Video:
      return Grpc.Icon.VIDEO
    case Icon.Warning:
      return Grpc.Icon.WARNING
    case Icon.WarningWithBackground:
      return Grpc.Icon.WARNINGWITHBACKGROUND
    case Icon.PaymentSuccess:
      return Grpc.Icon.PAYMENTSUCCESS
    case Icon.PaymentPending:
      return Grpc.Icon.PAYMENTPENDING
    case Icon.PaymentError:
      return Grpc.Icon.PAYMENTERROR
    case Icon.Refresh:
      return Grpc.Icon.REFRESH
  }
}
