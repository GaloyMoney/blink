import { MainBook } from "../mongodb"
import {
  assetsMainAccount,
  bankOwnerMediciPath,
  bitcoindAccountingPath,
  escrowAccountingPath,
  liabilitiesMainAccount,
  lndAccountingPath,
} from "./ledger"

export const getAccountBalance = async ({ account, currency = "BTC" }) => {
  const { balance } = await MainBook.balance({ account, currency })
  return balance
}

export const getAssetsBalance = (currency = "BTC") =>
  getAccountBalance({ account: assetsMainAccount, currency })

export const getLiabilitiesBalance = (currency = "BTC") =>
  getAccountBalance({ account: liabilitiesMainAccount, currency })

export const getLndBalance = () => getAccountBalance({ account: lndAccountingPath })

export const getLndEscrowBalance = () =>
  getAccountBalance({ account: escrowAccountingPath })

export const getBitcoindBalance = () =>
  getAccountBalance({ account: bitcoindAccountingPath })

export const getBankOwnerBalance = async (currency = "BTC") => {
  const bankOwnerPath = await bankOwnerMediciPath()
  return getAccountBalance({ account: bankOwnerPath, currency })
}
