import { checkedToAccountId } from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose"

export const updateAccountLevel = async ({
  accountId: accountIdRaw,
  level,
}: {
  accountId: string
  level: AccountLevel
}): Promise<Account | ApplicationError> => {
  const accountId = checkedToAccountId(accountIdRaw)
  if (accountId instanceof Error) return accountId

  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account

  account.level = level
  return accountsRepo.update(account)
}
