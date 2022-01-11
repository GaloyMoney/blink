import { checkedToLanguage } from "@domain/users"
import { UsersRepository } from "@services/mongoose"

export const updateLanguage = async ({
  userId,
  language,
}: UpdateLanguageArgs): Promise<User | ApplicationError> => {
  const checkedLanguage = checkedToLanguage(language)
  if (checkedLanguage instanceof Error) return checkedLanguage

  const usersRepo = UsersRepository()
  const user = await usersRepo.findById(userId)
  if (user instanceof Error) return user

  user.language = checkedLanguage
  return usersRepo.update(user)
}
