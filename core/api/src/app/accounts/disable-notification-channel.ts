import { disableNotificationChannel as domainDisableNotificationChannel } from "@/domain/notifications"
import { AccountsRepository } from "@/services/mongoose"

export const disableNotificationChannel = async ({
  accountId,
  notificationChannel,
}: {
  accountId: AccountId
  notificationChannel: NotificationChannel
}): Promise<Account | ApplicationError> => {
  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  const newNotificationSettings = domainDisableNotificationChannel({
    notificationSettings: account.notificationSettings,
    notificationChannel,
  })

  account.notificationSettings = newNotificationSettings

  return AccountsRepository().update(account)
}
