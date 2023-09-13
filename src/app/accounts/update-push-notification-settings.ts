import { checkedToPushNotificationSettings } from "@domain/notifications"

import { AccountsRepository } from "@services/mongoose"

export const updatePushNotificationSettings = async ({
  accountId,
  notificationSettings,
}: {
  accountId: AccountId
  notificationSettings: {
    enabled: boolean
    settings: {
      type: string
      enabled: boolean
      disabledSubtypes: string[]
    }[]
  }
}): Promise<Account | ApplicationError> => {
  const checkedPushNotificationSettings =
    checkedToPushNotificationSettings(notificationSettings)

  if (checkedPushNotificationSettings instanceof Error)
    return checkedPushNotificationSettings

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  account.pushNotificationSettings = checkedPushNotificationSettings

  return AccountsRepository().update(account)
}
