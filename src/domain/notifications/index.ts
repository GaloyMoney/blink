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
  enabled,
  settings,
}: {
  enabled: boolean
  settings: {
    type: string
    enabled: boolean
    disabledSubtypes: string[]
  }[]
}): PushNotificationSettings | InvalidPushNotificationSettingError => {
  const checkedSettings = settings.map(checkedToPushNotificationSetting)

  const notificationTypes = checkedSettings.map((s) => s.type)
  const uniqueTypes = [...new Set(notificationTypes)]
  if (notificationTypes.length !== uniqueTypes.length) {
    return new InvalidPushNotificationSettingError("Duplicate notification types")
  }

  return {
    enabled,
    settings: checkedSettings,
  }
}

export const checkedToPushNotificationSetting = ({
  type,
  enabled,
  disabledSubtypes,
}: {
  type: string
  enabled: boolean
  disabledSubtypes: string[]
}): PushNotificationSetting => {
  return {
    type: type as PushNotificationType,
    enabled,
    disabledSubtypes: disabledSubtypes as PushNotificationSubType[],
  }
}
