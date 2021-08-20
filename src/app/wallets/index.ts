export * from "./get-transactions-for-wallet"
export * from "./update-on-chain-receipt"

import { WalletsRepository } from "@services/mongoose"

export const getWallet = async (walletId: WalletId) => {
  const wallets = WalletsRepository()
  return wallets.findById(walletId)
}
