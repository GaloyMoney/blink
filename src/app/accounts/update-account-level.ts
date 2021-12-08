import { AccountsRepository } from "@services/mongoose"

export const updateAccountLevel = async ({
  id,
  level,
}: {
  id: string
  level: AccountLevel
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findById(id as AccountId)
  if (account instanceof Error) return account

  account.level = level
  return accountsRepo.update(account)
}
