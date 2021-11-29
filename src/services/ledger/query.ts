import { MainBook } from "./books"
import { Transaction } from "./schema"
import {
  assetsMainAccount,
  getBankOwnerWalletId,
  bitcoindAccountingPath,
  escrowAccountingPath,
  lndAccountingPath,
} from "./accounts"
import { liabilitiesMainAccount, toLiabilitiesAccountId } from "@domain/ledger"

export const getAllAccounts = () => {
  return MainBook.listAccounts()
}

export const getAccountByTransactionHash = async (hash) => {
  const entry = await getTransactionByHash(hash)
  return entry?.account_path
}

export const getTransactionByHash = async (hash) => {
  const bankOwnerPath = toLiabilitiesAccountId(await getBankOwnerWalletId())
  return Transaction.findOne({
    account_path: liabilitiesMainAccount,
    accounts: { $ne: bankOwnerPath },
    hash,
  })
}

export const getWalletBalance = async (account: string, query = {}) => {
  const params = { account, currency: "BTC", ...query }
  const { balance } = await MainBook.balance(params)
  return balance
}

export const getAccountTransactions = async (account: string, query = {}) => {
  const params = { account, ...query }
  const { results, total } = await MainBook.ledger(params)
  return { query: params, results, total }
}

export async function* getAccountsWithPendingTransactions(query = {}) {
  const transactions = Transaction.aggregate([
    { $match: { "pending": true, "account_path.0": liabilitiesMainAccount, ...query } },
    { $group: { _id: "$accounts" } },
  ])
    .cursor({ batchSize: 100 })
    .exec()

  for await (const { _id } of transactions) {
    yield _id
  }
}

export const getAssetsBalance = (currency = "BTC") =>
  getWalletBalance(assetsMainAccount, { currency })

export const getLiabilitiesBalance = (currency = "BTC") =>
  getWalletBalance(liabilitiesMainAccount, { currency })

export const getLndBalance = () => getWalletBalance(lndAccountingPath)

export const getLndEscrowBalance = () => getWalletBalance(escrowAccountingPath)

export const getBitcoindBalance = () => getWalletBalance(bitcoindAccountingPath)

export const getBitcoindTransactions = (query = {}) =>
  getAccountTransactions(bitcoindAccountingPath, query)

export const getBankOwnerBalance = async (currency = "BTC") => {
  const bankOwnerPath = toLiabilitiesAccountId(await getBankOwnerWalletId())
  return getWalletBalance(bankOwnerPath, { currency })
}
