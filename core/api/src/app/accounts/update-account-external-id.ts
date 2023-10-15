import { checkedToAccountId } from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose"

export const updateAccountExternalId = async ({
  accountId: accountIdRaw,
  externalId: externalIdRaw,
}: {
  accountId: string
  externalId: string
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const accountId = checkedToAccountId(accountIdRaw)
  if (accountId instanceof Error) return accountId

  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account

  const externalId = externalIdRaw as ExternalId

  account.externalId = externalId
  return accountsRepo.update(account)
}
