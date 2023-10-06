import { checkedToUsername } from "@/domain/accounts"
import { CouldNotFindError } from "@/domain/errors"
import { AccountsRepository } from "@/services/mongoose"

export const usernameAvailable = async (
  username: Username,
): Promise<boolean | ApplicationError> => {
  const checkedUsername = checkedToUsername(username)
  if (checkedUsername instanceof Error) return checkedUsername

  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findByUsername(checkedUsername)
  if (account instanceof CouldNotFindError) return true
  if (account instanceof Error) return account
  return false
}
