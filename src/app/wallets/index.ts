export * from "./create-on-chain-address"
export * from "./get-balance-for-wallet"
export * from "./get-csv-for-wallets"
export * from "./get-transactions-for-wallet"
export * from "./get-account-transactions-for-contact"
export * from "./get-last-on-chain-address"
export * from "./get-on-chain-fee"
export * from "./update-on-chain-receipt"
export * from "./update-pending-invoices"
export * from "./update-pending-payments"
export * from "./add-invoice-for-wallet"
export * from "../users/username-available"

import { WalletsRepository } from "@services/mongoose"

export const getWallet = async (walletId: WalletId) => {
  const wallets = WalletsRepository()
  return wallets.findById(walletId)
}
