import { Transaction } from "@services/ledger/schema"

export const getAccountTransactionsCount = (account: string, query = {}) => {
  const params = { accounts: account, ...query }
  return Transaction.countDocuments(params)
}
