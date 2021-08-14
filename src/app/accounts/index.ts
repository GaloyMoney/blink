import { MakeAccountsRepository } from "@services/mongoose/accounts"

export const getAccount = async (accountId: AccountId) => {
  const accounts = MakeAccountsRepository()
  return await accounts.findById(accountId)
}
