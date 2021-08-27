export * from "./get-transactions-for-wallet"
export * from "./update-on-chain-receipt"
export * from "./update-pending-invoices"
export * from "./add-invoice-for-wallet"

import { WalletsRepository } from "@services/mongoose"

export const getWallet = async (walletId: WalletId) => {
  const wallets = WalletsRepository()
  return wallets.findById(walletId)
}
