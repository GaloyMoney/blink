import { CouldNotFindError } from "@/domain/errors"
import { checkedToUsername } from "@/domain/accounts"
import { checkedToPhoneNumber } from "@/domain/users"

import { AccountsRepository } from "@/services/mongoose"

export const usernameAvailable = async (
  username: Username,
): Promise<boolean | ApplicationError> => {
  const checkedUsername = checkedToUsername(username)
  if (checkedUsername instanceof Error) {
    return false
  }

  // username can't be a valid phone number
  const phone = checkedToPhoneNumber(username)
  if (!(phone instanceof Error)) {
    return false
  }

  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findByUsername(checkedUsername)
  if (account instanceof CouldNotFindError) return true
  if (account instanceof Error) return account
  return false
}
