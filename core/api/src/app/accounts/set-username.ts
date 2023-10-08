import { usernameAvailable } from "./username-available"

import {
  checkedToAccountUuid,
  checkedToUsername,
  UsernameIsImmutableError,
  UsernameNotAvailableError,
} from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose"

export const setUsername = async ({
  accountUuid: accountUuidRaw,
  username,
}: {
  accountUuid: string
  username: string
}): Promise<Account | ApplicationError> => {
  const checkedUsername = checkedToUsername(username)
  if (checkedUsername instanceof Error) return checkedUsername

  const accountUuid = checkedToAccountUuid(accountUuidRaw)
  if (accountUuid instanceof Error) return accountUuid

  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findByUuid(accountUuid)
  if (account instanceof Error) return account
  if (account.username) return new UsernameIsImmutableError()

  const isAvailable = await usernameAvailable(checkedUsername)
  if (isAvailable instanceof Error) return isAvailable
  if (!isAvailable) return new UsernameNotAvailableError()

  account.username = checkedUsername
  return accountsRepo.update(account)
}
