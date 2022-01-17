import { WalletsRepository } from "@services/mongoose"

export const addWallet = async ({
  accountId,
  type,
  currency,
}: {
  accountId: AccountId
  type: WalletType
  currency: WalletCurrency
}): Promise<Wallet | ApplicationError> => {
  const wallet = await WalletsRepository().persistNew({
    accountId,
    type,
    currency,
  })
  if (wallet instanceof Error) return wallet

  return wallet
}
