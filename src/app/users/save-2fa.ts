import { TwoFA, TwoFAAlreadySetError } from "@domain/twoFA"
import { UsersRepository } from "@services/mongoose"

export const save2fa = async ({
  userId,
  secret,
  token,
}: {
  userId: UserId
  secret: TwoFASecret
  token: TwoFAToken
}): Promise<User | ApplicationError> => {
  const usersRepo = UsersRepository()

  const user = await usersRepo.findById(userId)
  if (user instanceof Error) return user

  if (user.twoFA.secret) {
    return new TwoFAAlreadySetError()
  }

  const twoFA = TwoFA()
  const tokenIsValid = twoFA.verify({ secret, token })
  if (tokenIsValid instanceof Error) return tokenIsValid

  user.twoFA.secret = secret
  return usersRepo.update(user)
}
