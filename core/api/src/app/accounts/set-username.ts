import { usernameAvailable } from "./username-available"

import {
  checkedToAccountId,
  checkedToUsername,
  UsernameIsImmutableError,
  UsernameNotAvailableError,
} from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose"

export const setUsername = async ({
  accountId: accountIdRaw,
  username,
}: {
  accountId: string
  username: string
}): Promise<Account | ApplicationError> => {
  const checkedUsername = checkedToUsername(username)
  if (checkedUsername instanceof Error) return checkedUsername

  const accountId = checkedToAccountId(accountIdRaw)
  if (accountId instanceof Error) return accountId

  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account
  if (account.username) return new UsernameIsImmutableError()

  const isAvailable = await usernameAvailable(checkedUsername)
  if (isAvailable instanceof Error) return isAvailable
  if (!isAvailable) return new UsernameNotAvailableError()

  account.username = checkedUsername
  return accountsRepo.update(account)
}
