import { checkedToLanguage } from "@domain/users"
import { UsersRepository } from "@services/mongoose/users"

type UpdateLanguageArgs = {
  kratosUserId: KratosUserId
  language: string
}

export const updateLanguage = async ({
  kratosUserId,
  language,
}: UpdateLanguageArgs): Promise<User | ApplicationError> => {
  const users = UsersRepository()

  const checkedLanguage = checkedToLanguage(language)
  if (checkedLanguage instanceof Error) return checkedLanguage

  const user = await users.findById(kratosUserId)
  if (user instanceof Error) return user

  return users.update({ ...user, language: checkedLanguage })
}
