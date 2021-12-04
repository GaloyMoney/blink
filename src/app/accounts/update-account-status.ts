import { AccountsRepository } from "@services/mongoose"

export const updateUserAccountStatus = async ({
  id,
  status,
}: {
  id: string
  status: string
}): Promise<Account | Error> => {
  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findById(id as AccountId)
  if (account instanceof Error) return account

  account.status = status as AccountStatus
  return accountsRepo.update(account)
}
