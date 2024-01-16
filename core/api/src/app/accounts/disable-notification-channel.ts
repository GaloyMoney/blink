import { AccountsRepository } from "@/services/mongoose"
import { NotificationsService } from "@/services/notifications"

export const disableNotificationChannel = async ({
  accountId,
  notificationChannel,
}: {
  accountId: AccountId
  notificationChannel: NotificationChannel
}): Promise<Account | ApplicationError> => {
  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  const notificationsService = NotificationsService()

  const newNotificationSettings = await notificationsService.disableNotificationChannel({
    userId: account.kratosUserId,
    notificationChannel,
  })

  if (newNotificationSettings instanceof Error) return newNotificationSettings

  return account
}
