export * from "./create-on-chain-address"
export * from "./get-balance-for-wallet"
export * from "./get-transactions-for-wallet"
export * from "./get-last-on-chain-address"
export * from "./update-on-chain-receipt"
export * from "./update-pending-invoices"
export * from "./update-pending-payments"
export * from "./add-invoice-for-wallet"
export * from "./wallet-name-available"
export * from "./reimburse-fee"

import { WalletsRepository } from "@services/mongoose"

export const getWallet = async (walletId: WalletId) => {
  const wallets = WalletsRepository()
  return wallets.findById(walletId)
}
