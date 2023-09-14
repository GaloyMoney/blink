import { checkedToPushNotificationSettings } from "@domain/notifications"

import { AccountsRepository } from "@services/mongoose"

export const updatePushNotificationSettings = async ({
  accountId,
  pushNotificationsEnabled,
  disabledPushNotificationTypes,
}: {
  accountId: AccountId
  pushNotificationsEnabled: boolean
  disabledPushNotificationTypes: string[]
}): Promise<Account | ApplicationError> => {
  const checkedPushNotificationSettings = checkedToPushNotificationSettings({
    disabledPushNotificationTypes,
    pushNotificationsEnabled,
  })

  if (checkedPushNotificationSettings instanceof Error)
    return checkedPushNotificationSettings

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  account.pushNotificationSettings = checkedPushNotificationSettings

  return AccountsRepository().update(account)
}
