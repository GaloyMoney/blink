import { WalletsRepository } from "@services/mongoose"

export const getAllWallets = async (
  walletCurrency: WalletCurrency,
  limit = 5,
  offset = 0,
): Promise<Wallet[] | RepositoryError> => {
  return WalletsRepository().listAll(walletCurrency, limit, offset)
}
