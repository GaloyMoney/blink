import { checkedAccountStatus } from "@domain/accounts"
import { AccountsRepository } from "@services/mongoose"

export const updateAccountStatus = async ({
  id,
  status,
  updatedByUserId,
  comment,
}: {
  id: string
  status: string
  updatedByUserId: UserId
  comment?: string
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findById(id as AccountId)
  if (account instanceof Error) return account

  const statusChecked = checkedAccountStatus(status)
  if (statusChecked instanceof Error) return statusChecked

  account.statusHistory = (account.statusHistory ?? []).concat({
    status: statusChecked,
    updatedByUserId,
    comment,
  })
  return accountsRepo.update(account)
}
