import {
  NotificationChannel,
  checkedToNotificationCategory,
} from "@/domain/notifications"
import { AccountsRepository } from "@/services/mongoose"
import { NotificationsService } from "@/services/notifications"

export const enableNotificationCategory = async ({
  accountId,
  notificationChannel,
  notificationCategory,
}: {
  accountId: AccountId
  notificationChannel?: NotificationChannel
  notificationCategory: string
}): Promise<Account | ApplicationError> => {
  const checkedNotificationCategory = checkedToNotificationCategory(notificationCategory)
  if (checkedNotificationCategory instanceof Error) return checkedNotificationCategory

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  const notificationsService = NotificationsService()

  const newNotificationSettings = await notificationsService.enableNotificationCategory({
    userId: account.kratosUserId,
    notificationChannel: notificationChannel || NotificationChannel.Push,
    notificationCategory: checkedNotificationCategory,
  })

  if (newNotificationSettings instanceof Error) return newNotificationSettings

  return account
}
