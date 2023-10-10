import { checkedAccountStatus, checkedToAccountId } from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose"

export const updateAccountStatus = async ({
  accountId: accountIdRaw,
  status,
  updatedByPrivilegedClientId,
  comment,
}: {
  accountId: string
  status: string
  updatedByPrivilegedClientId: PrivilegedClientId
  comment?: string
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const accountId = checkedToAccountId(accountIdRaw)
  if (accountId instanceof Error) return accountId

  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account

  const statusChecked = checkedAccountStatus(status)
  if (statusChecked instanceof Error) return statusChecked

  account.statusHistory = (account.statusHistory ?? []).concat({
    status: statusChecked,
    updatedByPrivilegedClientId,
    comment,
  })
  return accountsRepo.update(account)
}
