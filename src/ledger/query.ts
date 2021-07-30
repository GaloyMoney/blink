import { MainBook } from "./books"
import {
  assetsMainAccount,
  bankOwnerAccountPath,
  bitcoindAccountingPath,
  escrowAccountingPath,
  liabilitiesMainAccount,
  lndAccountingPath,
} from "./accounts"
import { Transaction } from "src/schema"

export const getAllAccounts = () => {
  return MainBook.listAccounts()
}

export const getAccountByTransactionHash = async (hash) => {
  const entry = await getTransactionByHash(hash)
  return entry?.account_path
}

export const getTransactionByHash = async (hash) => {
  const bankOwnerPath = await bankOwnerAccountPath()
  return Transaction.findOne({
    account_path: liabilitiesMainAccount,
    accounts: { $ne: bankOwnerPath },
    hash,
  })
}

export const getAccountBalance = async (account: string, query = {}) => {
  const params = { account, currency: "BTC", ...query }
  const { balance } = await MainBook.balance(params)
  return balance
}

export const getAccountTransactionsCount = (account: string, query = {}) => {
  const params = { accounts: account, ...query }
  return Transaction.countDocuments(params)
}

export const getAccountTransactions = async (account: string, query = {}) => {
  const params = { account, ...query }
  const { results, total } = await MainBook.ledger(params)
  return { query: params, results, total }
}

export const getAssetsBalance = (currency = "BTC") =>
  getAccountBalance(assetsMainAccount, { currency })

export const getLiabilitiesBalance = (currency = "BTC") =>
  getAccountBalance(liabilitiesMainAccount, { currency })

export const getLndBalance = () => getAccountBalance(lndAccountingPath)

export const getLndEscrowBalance = () => getAccountBalance(escrowAccountingPath)

export const getBitcoindBalance = () => getAccountBalance(bitcoindAccountingPath)

export const getBitcoindTransactions = (query = {}) =>
  getAccountTransactions(bitcoindAccountingPath, query)

export const getBankOwnerBalance = async (currency = "BTC") => {
  const bankOwnerPath = await bankOwnerAccountPath()
  return getAccountBalance(bankOwnerPath, { currency })
}
