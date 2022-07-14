import { WalletsRepository } from "@services/mongoose"

export const getAllWallets = async ({
  walletCurrency,
  limit = 5,
  offset = 0,
}: GetAllWalletsArgs): Promise<Wallet[] | RepositoryError> => {
  return WalletsRepository().listAll({
    walletCurrency,
    limit,
    offset,
  })
}
