import { WalletsRepository } from "@services/mongoose"

export const getAllWallets = async (
  walletCurrency: WalletCurrency,
): Promise<Wallet[] | RepositoryError> => {
  return WalletsRepository().listAll(walletCurrency)
}
