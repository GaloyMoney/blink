import { CouldNotFindError } from "@domain/errors"
import { checkedToUsername } from "@domain/users"
import { WalletsRepository } from "@services/mongoose"

export const usernameAvailable = async (
  username: Username,
): Promise<boolean | ApplicationError> => {
  const checkedUsername = checkedToUsername(username)
  if (checkedUsername instanceof Error) return checkedUsername

  const walletsRepo = WalletsRepository()

  const wallet = await walletsRepo.findByUsername(checkedUsername)
  if (wallet instanceof CouldNotFindError) return true
  if (wallet instanceof Error) return wallet
  return false
}
