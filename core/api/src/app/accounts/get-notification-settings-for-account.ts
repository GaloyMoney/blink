import { NotificationsService } from "@/services/notifications"

export const getNotificationSettingsForAccount = ({
  account,
}: {
  account: Account
}): Promise<NotificationSettings | ApplicationError> => {
  const notificationsService = NotificationsService()

  return notificationsService.getUserNotificationSettings(account.kratosUserId)
}
