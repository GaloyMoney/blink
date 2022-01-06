import {
  TwoFA,
  TwoFANeedToBeSetBeforeDeletionError,
  TwoFAValidationError,
} from "@domain/twoFA"
import { UsersRepository } from "@services/mongoose"

export const delete2fa = async ({
  token,
  userId,
}: {
  token: TwoFAToken
  userId: UserId
}): Promise<User | ApplicationError> => {
  const usersRepo = UsersRepository()

  const user = await usersRepo.findById(userId)
  if (user instanceof Error) return user

  if (user.twoFA.secret === undefined) {
    return new TwoFANeedToBeSetBeforeDeletionError()
  }

  const twoFA = TwoFA()
  const isVerified = twoFA.verify({ secret: user.twoFA.secret, token })
  if (isVerified instanceof Error) return new TwoFAValidationError()

  user.twoFA.secret = undefined
  return usersRepo.update(user)
}
