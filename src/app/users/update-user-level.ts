import { AccountsRepository } from "@services/mongoose"

export const updateUserLevel = async ({
  id,
  level,
}: {
  id: string
  level: number
}): Promise<Account | Error> => {
  const accountsRepo = AccountsRepository()
  const level_ = level as AccountLevel

  const account = await accountsRepo.findById(id as AccountId)
  if (account instanceof Error) return account

  account.level = level_
  return accountsRepo.update(account)
}
