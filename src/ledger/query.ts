import { MainBook } from "./books"
import {
  assetsMainAccount,
  bankOwnerAccountPath,
  bitcoindAccountingPath,
  escrowAccountingPath,
  liabilitiesMainAccount,
  lndAccountingPath,
} from "./accounts"

export const getAllAccounts = () => {
  return MainBook.listAccounts()
}

export const getAccountBalance = async (account: string, query = {}) => {
  const params = { account, currency: "BTC", ...query }
  const { balance } = await MainBook.balance(params)
  return balance
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
