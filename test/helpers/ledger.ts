import { Transaction } from "@services/ledger/schema"
import {
  bankOwnerAccountPath,
  bitcoindAccountingPath,
  liabilitiesMainAccount,
} from "@services/ledger/accounts"
import { MainBook } from "@services/ledger/books"

export const getTransactionByHash = async (hash) => {
  const bankOwnerPath = await bankOwnerAccountPath()
  return Transaction.findOne({
    account_path: liabilitiesMainAccount,
    accounts: { $ne: bankOwnerPath },
    hash,
  })
}

export const getAccountTransactions = async (account: string, query = {}) => {
  const params = { account, ...query }
  const { results, total } = await MainBook.ledger(params)
  return { query: params, results, total }
}

export const getBitcoindTransactions = (query = {}) =>
  getAccountTransactions(bitcoindAccountingPath, query)
