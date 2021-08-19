export * from "./get-transactions-for-wallet"
export * from "./update-on-chain-receipt"
export * from "./add-invoice-for-wallet"
export * from "./create-on-chain-address"

import { WalletsRepository } from "@services/mongoose"

export const getWallet = async (walletId: WalletId) => {
  const wallets = WalletsRepository()
  return wallets.findById(walletId)
}
