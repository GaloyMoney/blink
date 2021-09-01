import { UsersRepository } from "@services/mongoose"
import { ValidationError } from "@domain/errors"

export const getUser = async (userId: UserId): Promise<User | ApplicationError> => {
  const repo = UsersRepository()
  return repo.findById(userId)
}

export const updateWalletContactAlias = async ({
  userId,
  walletName,
  alias,
}: {
  userId: UserId
  walletName: string
  alias: string
}): Promise<User | ApplicationError> => {
  const repo = UsersRepository()
  const user = await repo.findById(userId)
  if (user instanceof Error) {
    return user
  }

  const found = user.contacts.find(
    (walletContact) => walletContact.walletName === walletName,
  )
  if (!found) {
    return new ValidationError("User doesn't have walletContact")
  }
  found.alias = alias as ContactAlias

  const result = await repo.update(user)
  if (result instanceof Error) {
    return result
  }

  return user
}
