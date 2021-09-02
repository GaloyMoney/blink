import { Transaction } from "@services/ledger/schema"

export const getAccountTransactionsCount = async (account: string, query = {}) => {
  const params = { accounts: account, ...query }
  return Transaction.countDocuments(params)
}
