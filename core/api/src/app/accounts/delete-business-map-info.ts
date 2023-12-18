import { AccountValidator, checkedToUsername } from "@/domain/accounts"

import { AccountsRepository } from "@/services/mongoose/accounts"

export const deleteBusinessMapInfo = async ({
  username,
}: {
  username: string
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const usernameChecked = checkedToUsername(username)
  if (usernameChecked instanceof Error) return usernameChecked

  const account = await accountsRepo.findByUsername(usernameChecked)
  if (account instanceof Error) return account
  const accountValidator = AccountValidator(account)
  if (accountValidator instanceof Error) return accountValidator

  const newAccount = { ...account, title: null, coordinates: null }

  return accountsRepo.update(newAccount)
}
