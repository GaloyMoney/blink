import { DefaultLanguage } from "@/domain/users"
import { NotificationsService } from "@/services/notifications"

export const getUserLanguage = async (user: User): Promise<UserLanguageOrEmpty> => {
  const settings = await NotificationsService().getUserNotificationSettings(user.id)

  if (settings instanceof Error) return DefaultLanguage

  return settings.language
}
