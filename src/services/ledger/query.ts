import { liabilitiesMainAccount, toLiabilitiesWalletId } from "@domain/ledger"

import {
  assetsMainAccount,
  getBankOwnerWalletId,
  bitcoindAccountingPath,
  escrowAccountingPath,
  lndAccountingPath,
} from "./accounts"
import { MainBook } from "./books"

export const getAllAccounts = () => {
  return MainBook.listAccounts()
}

const getWalletBalance = async (account: string, query = {}) => {
  const params = { account, currency: "BTC", ...query }
  const { balance } = await MainBook.balance(params)
  return balance
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
