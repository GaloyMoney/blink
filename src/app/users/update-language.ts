import { checkedToLanguage } from "@domain/users"
import { IdentityRepository } from "@services/kratos"

type UpdateLanguageArgs = {
  kratosUserId: KratosUserId
  language: string
}

export const updateLanguage = async ({
  kratosUserId,
  language,
}: UpdateLanguageArgs): Promise<IdentityPhone | ApplicationError> => {
  const identityRepo = IdentityRepository()

  const checkedLanguage = checkedToLanguage(language)
  if (checkedLanguage instanceof Error) return checkedLanguage

  const user = await identityRepo.getIdentity(kratosUserId)
  if (user instanceof Error) return user

  return identityRepo.setLanguage({ id: kratosUserId, language: checkedLanguage })
}
