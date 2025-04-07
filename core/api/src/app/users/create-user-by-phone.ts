import { CouldNotFindError } from "@/domain/errors"
import { AuthWithPhonePasswordlessService } from "@/services/kratos"
import { UsersRepository } from "@/services/mongoose"

export const createUserByPhone = async (
  phone: PhoneNumber,
): Promise<User | ApplicationError> => {
  const authService = AuthWithPhonePasswordlessService()
  const user = await UsersRepository().findByPhone(phone)

  if (user instanceof Error && !(user instanceof CouldNotFindError)) return user

  if (user instanceof CouldNotFindError) {
    const kratosResult = await authService.createIdentityWithSession({ phone })
    if (kratosResult instanceof Error) return kratosResult

    const { kratosUserId } = kratosResult
    const persistedUser = await UsersRepository().update({ id: kratosUserId, phone })
    if (persistedUser instanceof Error) return persistedUser

    return persistedUser
  }

  return user
}
