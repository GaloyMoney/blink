import { checkedToAccountUuid } from "@/domain/accounts"
import { AccountsRepository } from "@/services/mongoose"

export const updateAccountLevel = async ({
  accountUuid: accountUuidRaw,
  level,
}: {
  accountUuid: string
  level: AccountLevel
}): Promise<Account | ApplicationError> => {
  const accountUuid = checkedToAccountUuid(accountUuidRaw)
  if (accountUuid instanceof Error) return accountUuid

  const accountsRepo = AccountsRepository()

  const account = await accountsRepo.findByUuid(accountUuid)
  if (account instanceof Error) return account

  account.level = level
  return accountsRepo.update(account)
}
