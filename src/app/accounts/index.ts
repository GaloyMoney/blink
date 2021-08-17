import { AccountsRepository } from "@services/mongoose"

export const getAccount = async (accountId: AccountId) => {
  const accounts = AccountsRepository()
  return accounts.findById(accountId)
}
