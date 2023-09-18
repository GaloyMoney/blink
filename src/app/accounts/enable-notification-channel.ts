import { setNotificationChannelIsEnabled } from "@domain/notifications"
import { AccountsRepository } from "@services/mongoose"

export const enableNotificationChannel = async ({
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
    enabled: true,
  })

  account.notificationSettings = newNotificationSettings

  return AccountsRepository().update(account)
}
