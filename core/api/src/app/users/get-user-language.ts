import { DefaultLanguage } from "@/domain/users"
import { NotificationsService } from "@/services/notifications"

export const getUserLanguage = async (userId: UserId): Promise<UserLanguageOrEmpty> => {
  const settings = await NotificationsService().getUserNotificationSettings(userId)

  if (settings instanceof Error) return DefaultLanguage

  return settings.language
}
