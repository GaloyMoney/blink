import {
  checkedToNotificationCategory,
  enableNotificationCategory as domainEnableNotificationCategory,
} from "@/domain/notifications"
import { AccountsRepository } from "@/services/mongoose"

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

  const newNotificationSettings = domainEnableNotificationCategory({
    notificationSettings: account.notificationSettings,
    notificationChannel,
    notificationCategory: checkedNotificationCategory,
  })

  account.notificationSettings = newNotificationSettings

  return AccountsRepository().update(account)
}
