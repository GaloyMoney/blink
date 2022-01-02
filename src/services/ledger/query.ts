import { liabilitiesMainAccount, toLiabilitiesWalletId } from "@domain/ledger"

import {
  assetsMainAccount,
  getBankOwnerWalletId,
  bitcoindAccountingPath,
  escrowAccountingPath,
  lndAccountingPath,
} from "./accounts"
import { MainBook } from "./books"
import { Transaction } from "./schema"

export const getAllAccounts = () => {
  return MainBook.listAccounts()
}

const getWalletBalance = async (account: string, query = {}) => {
  const params = { account, currency: "BTC", ...query }
  const { balance } = await MainBook.balance(params)
  return balance
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

export const getBankOwnerBalance = async (currency = "BTC") => {
  const bankOwnerPath = toLiabilitiesWalletId(await getBankOwnerWalletId())
  return getWalletBalance(bankOwnerPath, { currency })
}
