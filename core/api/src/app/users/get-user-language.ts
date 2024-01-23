import { NotificationsService } from "@/services/notifications"

export const getUserLanguage = async (
  user: User,
): Promise<UserLanguageOrEmpty | ApplicationError> => {
  const settings = await NotificationsService().getUserNotificationSettings(user.id)

  if (settings instanceof Error) return settings

  return settings.language
}
