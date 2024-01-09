import { WalletsRepository } from "@/services/mongoose"

export const addWalletIfNonexistent = async ({
  accountId,
  type,
  currency,
}: {
  accountId: AccountId
  type: WalletType
  currency: WalletCurrency
}): Promise<Wallet | ApplicationError> => {
  const wallets = await WalletsRepository().listByAccountId(accountId)
  if (wallets instanceof Error) return wallets

  const walletOfTypeAndCurrency = wallets.find(
    (wallet) => wallet.currency === currency && wallet.type === type,
  )
  if (walletOfTypeAndCurrency) return walletOfTypeAndCurrency

  return WalletsRepository().persistNew({
    accountId,
    type,
    currency,
  })
}
