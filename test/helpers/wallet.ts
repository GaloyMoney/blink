import { PartialResult } from "@app/partial-result"
import { getBalanceForWallet, getTransactionsForWallets } from "@app/wallets"
import { RepositoryError } from "@domain/errors"
import { baseLogger } from "@services/logger"
import { WalletsRepository } from "@services/mongoose"

export const getBalanceHelper = async (
  walletId: WalletId,
): Promise<CurrencyBaseAmount> => {
  const balance = await getBalanceForWallet({
    walletId,
    logger: baseLogger,
  })
  if (balance instanceof Error) throw balance
  return balance
}

export const getTransactionsForWalletId = async (
  walletId: WalletId,
): Promise<PartialResult<PaginatedArray<WalletTransaction>>> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof RepositoryError) return PartialResult.err(wallet)
  return getTransactionsForWallets({ wallets: [wallet] })
}
