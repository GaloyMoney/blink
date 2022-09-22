import { checkedToAccountId } from "@domain/accounts"

import { AccountsRepository } from "@services/mongoose"

export const updateAccountSettings = async ({
  accountId,
  contactEnabled,
}: {
  accountId: string
  contactEnabled: boolean
}): Promise<Account | ApplicationError> => {
  const accountIdChecked = checkedToAccountId(accountId)
  if (accountIdChecked instanceof Error) return accountIdChecked

  const accountsRepo = AccountsRepository()
  const account = await accountsRepo.findById(accountIdChecked)
  if (account instanceof Error) return account

  account.contactEnabled = contactEnabled

  return accountsRepo.update(account)
}
