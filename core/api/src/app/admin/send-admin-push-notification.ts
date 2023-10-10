import { checkedToAccountId } from "@/domain/accounts"
import {
  GaloyNotificationCategories,
  checkedToNotificationCategory,
} from "@/domain/notifications"
import { AccountsRepository } from "@/services/mongoose/accounts"
import { UsersRepository } from "@/services/mongoose/users"
import { NotificationsService } from "@/services/notifications"

export const sendAdminPushNotification = async ({
  accountId: accountIdRaw,
  title,
  body,
  data,
  notificationCategory,
}: {
  accountId: string
  title: string
  body: string
  data?: { [key: string]: string }
  notificationCategory?: string
}): Promise<true | ApplicationError> => {
  const checkedNotificationCategory = notificationCategory
    ? checkedToNotificationCategory(notificationCategory)
    : GaloyNotificationCategories.AdminPushNotification

  if (checkedNotificationCategory instanceof Error) return checkedNotificationCategory

  const accountId = checkedToAccountId(accountIdRaw)
  if (accountId instanceof Error) return accountId

  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account
  const kratosUserId = account.kratosUserId

  const usersRepo = UsersRepository()
  const user = await usersRepo.findById(kratosUserId)
  if (user instanceof Error) return user

  const success = await NotificationsService().adminPushNotificationFilteredSend({
    deviceTokens: user.deviceTokens,
    title,
    body,
    data,
    notificationCategory: checkedNotificationCategory,
    notificationSettings: account.notificationSettings,
  })

  return success
}
