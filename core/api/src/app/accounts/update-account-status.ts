import { checkedAccountStatus, checkedToAccountUuid } from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose"

export const updateAccountStatus = async ({
  accountUuid: accountUuidRaw,
  status,
  updatedByPrivilegedClientId,
  comment,
}: {
  accountUuid: string
  status: string
  updatedByPrivilegedClientId: PrivilegedClientId
  comment?: string
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const accountUuid = checkedToAccountUuid(accountUuidRaw)
  if (accountUuid instanceof Error) return accountUuid

  const account = await accountsRepo.findByUuid(accountUuid)
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
