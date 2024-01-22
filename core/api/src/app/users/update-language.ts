import { checkedToLanguage } from "@/domain/users"
import { UsersRepository } from "@/services/mongoose"
import { NotificationsService } from "@/services/notifications"

export const updateLanguage = async ({
  userId,
  language,
}: UpdateLanguageArgs): Promise<User | ApplicationError> => {
  const checkedLanguage = checkedToLanguage(language)
  if (checkedLanguage instanceof Error) return checkedLanguage

  const users = UsersRepository()
  const user = await users.findById(userId)
  if (user instanceof Error) return user

  const settings = await NotificationsService().updateUserLanguage({
    userId: user.id,
    language: checkedLanguage,
  })

  if (settings instanceof Error) return settings

  return user
}
