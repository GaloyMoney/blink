import { bitcoindAccountingPath } from "@services/ledger/accounts"
import { MainBook } from "@services/ledger/books"

// TODO: delete after getBitcoindTransactions has been rewritten
const getAccountTransactions = async (account: string, query = {}) => {
  const params = { account, ...query }
  const { results, total } = await MainBook.ledger(params)
  return { query: params, results, total }
}

export const getBitcoindTransactions = (query = {}) =>
  getAccountTransactions(bitcoindAccountingPath, query)
