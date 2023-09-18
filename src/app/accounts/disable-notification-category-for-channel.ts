import {
  checkedToNotificationCategory,
  disableNotificationCategoryForChannel as disableNotificationCategory,
} from "@domain/notifications"
import { AccountsRepository } from "@services/mongoose"

export const disableNotificationCategoryForChannel = async ({
  accountId,
  notificationChannel,
  notificationCategory,
}: {
  accountId: AccountId
  notificationChannel: NotificationChannel
  notificationCategory: string
}): Promise<Account | ApplicationError> => {
  const checkedNotificationCategory = checkedToNotificationCategory(notificationCategory)
  if (checkedNotificationCategory instanceof Error) return checkedNotificationCategory

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  const newNotificationSettings = disableNotificationCategory({
    notificationSettings: account.notificationSettings,
    notificationChannel,
    notificationCategory: checkedNotificationCategory,
  })

  account.notificationSettings = newNotificationSettings

  return AccountsRepository().update(account)
}
