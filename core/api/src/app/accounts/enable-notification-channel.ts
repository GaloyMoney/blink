import { enableNotificationChannel as domainEnableNotificationChannel } from "@/domain/notifications"
import { AccountsRepository } from "@/services/mongoose"

export const enableNotificationChannel = async ({
  accountUuid,
  notificationChannel,
}: {
  accountUuid: AccountUuid
  notificationChannel: NotificationChannel
}): Promise<Account | ApplicationError> => {
  const account = await AccountsRepository().findByUuid(accountUuid)
  if (account instanceof Error) return account

  const newNotificationSettings = domainEnableNotificationChannel({
    notificationSettings: account.notificationSettings,
    notificationChannel,
  })

  account.notificationSettings = newNotificationSettings

  return AccountsRepository().update(account)
}
