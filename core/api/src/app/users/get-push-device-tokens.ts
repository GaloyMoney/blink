import { NotificationsService } from "@/services/notifications"

export const getPushDeviceTokens = async (
  user: User,
): Promise<DeviceToken[] | ApplicationError> => {
  const settings = await NotificationsService().getUserNotificationSettings(user.id)

  if (settings instanceof Error) return settings

  return settings.pushDeviceTokens
}
