import { LedgerService } from "@services/ledger"
import { WalletsRepository } from "@services/mongoose"

export const getUserLiabilities = async () => {
  const wallets = await WalletsRepository().listAll()
  if (wallets instanceof Error) return wallets
  const btcWallets = wallets.filter((wallet) => wallet.currency === "BTC")
  const liabilities = btcWallets.map((wallet) => walletToLiability(wallet))
  return liabilities
}

const walletToLiability = async (wallet: Wallet) => {
  const balance = LedgerService().getWalletBalance(wallet.id)
  if (balance instanceof Error) return balance
  return {
    walletId: wallet.id,
    balance,
  }
}
