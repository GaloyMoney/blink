export * from "./errors"
import { checkedToNonEmptyLanguage } from "../users"

import {
  InvalidNotificationBodyError,
  InvalidNotificationCategoryError,
  InvalidNotificationTitleError,
  DuplicateLocalizedNotificationContentError,
} from "./errors"

export const NotificationType = {
  IntraLedgerReceipt: "intra_ledger_receipt",
  IntraLedgerPayment: "intra_ledger_payment",
  OnchainReceipt: "onchain_receipt",
  OnchainReceiptPending: "onchain_receipt_pending",
  OnchainPayment: "onchain_payment",
  LigtningReceipt: "paid-invoice",
  LigtningPayment: "lightning_payment",
} as const

export const NotificationCategory = {
  Payments: "Payments",
  Circles: "Circles",
  Price: "Price",
  AdminNotification: "AdminNotification",
  Marketing: "Marketing",
} as const

export const checkedToNotificationCategory = (
  notificationCategory: string,
): NotificationCategory | ValidationError => {
  // TODO: add validation
  if (
    !notificationCategory ||
    !Object.values(NotificationCategory).find(
      (category) => category === notificationCategory,
    )
  ) {
    return new InvalidNotificationCategoryError(
      `Invalid notification category: ${notificationCategory}`,
    )
  }

  return notificationCategory as NotificationCategory
}

export const NotificationChannel = {
  Push: "push",
} as const

export const DeepLinkScreen = {
  Circles: "Circles",
  Price: "Price",
  Earn: "Earn",
  Map: "Map",
  People: "People",
  Home: "Home",
  Receive: "Receive",
  Convert: "Convert",
  ScanQR: "ScanQR",
  Chat: "Chat",
  Settings: "Settings",
  Settings2FA: "Settings2FA",
  SettingsDisplayCurrency: "SettingsDisplayCurrency",
  SettingsDefaultAccount: "SettingsDefaultAccount",
  SettingsLanguage: "SettingsLanguage",
  SettingsTheme: "SettingsTheme",
  SettingsSecurity: "SettingsSecurity",
  SettingsAccount: "SettingsAccount",
  SettingsTxLimits: "SettingsTxLimits",
  SettingsNotifications: "SettingsNotifications",
  SettingsEmail: "SettingsEmail",
} as const

export const DeepLinkAction = {
  SetLnAddressModal: "SetLnAddressModal",
  SetDefaultAccountModal: "SetDefaultAccountModal",
  UpgradeAccountModal: "UpgradeAccountModal",
} as const

export const checkedToLocalizedNotificationTitle = (
  title: string,
): LocalizedNotificationTitle | ValidationError => {
  if (title.length === 0) {
    return new InvalidNotificationTitleError()
  }

  return title as LocalizedNotificationTitle
}

export const checkedToLocalizedNotificationBody = (
  body: string,
): LocalizedNotificationBody | ValidationError => {
  if (body.length === 0) {
    return new InvalidNotificationBodyError()
  }

  return body as LocalizedNotificationBody
}

export const checkedToLocalizedNotificationContentsMap = (
  localizedNotificationContents: {
    title: string
    body: string
    language: string
  }[],
): Map<UserLanguage, LocalizedNotificationContent> | ValidationError => {
  const map = new Map<UserLanguage, LocalizedNotificationContent>()

  for (const content of localizedNotificationContents) {
    const checkedLanguage = checkedToNonEmptyLanguage(content.language.toLowerCase())
    if (checkedLanguage instanceof Error) {
      return checkedLanguage
    }

    const checkedTitle = checkedToLocalizedNotificationTitle(content.title)
    if (checkedTitle instanceof Error) {
      return checkedTitle
    }

    const checkedBody = checkedToLocalizedNotificationBody(content.body)
    if (checkedBody instanceof Error) {
      return checkedBody
    }

    if (map.has(checkedLanguage)) {
      return new DuplicateLocalizedNotificationContentError(
        `Duplicated language: ${checkedLanguage}`,
      )
    }

    map.set(checkedLanguage, {
      title: checkedTitle,
      body: checkedBody,
      language: checkedLanguage,
    })
  }

  return map
}
