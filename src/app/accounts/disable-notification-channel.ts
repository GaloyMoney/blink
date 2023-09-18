import { setNotificationChannelIsEnabled } from "@domain/notifications"
import { AccountsRepository } from "@services/mongoose"

export const disableNotificationChannel = async ({
  accountId,
  notificationChannel,
}: {
  accountId: AccountId
  notificationChannel: NotificationChannel
}): Promise<Account | ApplicationError> => {
  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  const newNotificationSettings = setNotificationChannelIsEnabled({
    notificationSettings: account.notificationSettings,
    notificationChannel,
    enabled: false,
  })

  account.notificationSettings = newNotificationSettings

  return AccountsRepository().update(account)
}
