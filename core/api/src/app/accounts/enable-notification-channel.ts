import { enableNotificationChannel as domainEnableNotificationChannel } from "@/domain/notifications"
import { AccountsRepository } from "@/services/mongoose"

export const enableNotificationChannel = async ({
  accountId,
  notificationChannel,
}: {
  accountId: AccountId
  notificationChannel: NotificationChannel
}): Promise<Account | ApplicationError> => {
  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  const newNotificationSettings = domainEnableNotificationChannel({
    notificationSettings: account.notificationSettings,
    notificationChannel,
  })

  account.notificationSettings = newNotificationSettings

  return AccountsRepository().update(account)
}
