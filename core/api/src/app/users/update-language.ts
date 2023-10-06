import { checkedToLanguage } from "@/domain/users"
import { UsersRepository } from "@/services/mongoose"

export const updateLanguage = async ({
  userId,
  language,
}: UpdateLanguageArgs): Promise<User | ApplicationError> => {
  const users = UsersRepository()

  const checkedLanguage = checkedToLanguage(language)
  if (checkedLanguage instanceof Error) return checkedLanguage

  const user = await users.findById(userId)
  if (user instanceof Error) return user

  return users.update({ ...user, language: checkedLanguage })
}
