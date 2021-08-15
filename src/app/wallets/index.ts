export * from "./get-transactions-for-wallet"

import { MakeWalletsRepository } from "@services/mongoose/wallets"

export const getWallet = async (walletId: WalletId) => {
  const wallets = MakeWalletsRepository()
  return wallets.findById(walletId)
}
