import { usernameAvailable } from "@app/accounts"
import {
  checkedToUsername,
  UsernameIsImmutableError,
  UsernameNotAvailableError,
} from "@domain/accounts"
import { AccountsRepository } from "@services/mongoose"

export const setUsername = async ({
  id,
  username,
}: {
  id: string
  username: string
}): Promise<Account | ApplicationError> => {
  const checkedUsername = checkedToUsername(username)
  if (checkedUsername instanceof Error) return checkedUsername

  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findById(id as AccountId)
  if (account instanceof Error) return account
  if (account.username) return new UsernameIsImmutableError()

  const isAvailable = await usernameAvailable(checkedUsername)
  if (isAvailable instanceof Error) return isAvailable
  if (!isAvailable) return new UsernameNotAvailableError()

  account.username = checkedUsername
  return accountsRepo.update(account)
}
