import { checkedAccountStatus } from "@domain/accounts"
import { AccountsRepository } from "@services/mongoose"

export const updateAccountStatus = async ({
  id,
  status,
}: {
  id: string
  status: string
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findById(id as AccountId)
  if (account instanceof Error) return account

  const statusChecked = checkedAccountStatus(status)
  if (statusChecked instanceof Error) return statusChecked

  account.status = statusChecked
  return accountsRepo.update(account)
}
