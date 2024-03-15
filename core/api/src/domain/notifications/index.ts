export * from "./errors"
import { checkedToNonEmptyLanguage } from "../users"

import {
  InvalidPushBodyError,
  InvalidPushNotificationSettingError,
  InvalidPushTitleError,
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
  AdminNotification: "AdminNotification" as NotificationCategory,
} as const

export const DeepLink = {
  Circles: "Circles",
  Price: "Price",
  Earn: "Earn",
  Map: "Map",
  People: "People",
} as const

export const checkedToLocalizedPushTitle = (
  title: string,
): LocalizedPushTitle | ValidationError => {
  if (title.length === 0) {
    return new InvalidPushTitleError()
  }

  return title as LocalizedPushTitle
}

export const checkedToLocalizedPushBody = (
  body: string,
): LocalizedPushBody | ValidationError => {
  if (body.length === 0) {
    return new InvalidPushBodyError()
  }

  return body as LocalizedPushBody
}

export const checkedToLocalizedPushContentsMap = (
  localizedPushContents: {
    title: string
    body: string
    language: string
  }[],
): Map<UserLanguage, LocalizedPushContent> | ValidationError => {
  const map = new Map<UserLanguage, LocalizedPushContent>()

  for (const content of localizedPushContents) {
    const checkedLanguage = checkedToNonEmptyLanguage(content.language.toLowerCase())
    if (checkedLanguage instanceof Error) {
      return checkedLanguage
    }

    const checkedTitle = checkedToLocalizedPushTitle(content.title)
    if (checkedTitle instanceof Error) {
      return checkedTitle
    }

    const checkedBody = checkedToLocalizedPushBody(content.body)
    if (checkedBody instanceof Error) {
      return checkedBody
    }

    if (map.has(checkedLanguage)) {
      return new InvalidPushNotificationSettingError(
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
