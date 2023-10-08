import { WalletsRepository } from "@/services/mongoose"

export const addWallet = async ({
  accountUuid,
  type,
  currency,
}: {
  accountUuid: AccountUuid
  type: WalletType
  currency: WalletCurrency
}): Promise<Wallet | ApplicationError> => {
  const wallet = await WalletsRepository().persistNew({
    accountUuid,
    type,
    currency,
  })
  if (wallet instanceof Error) return wallet

  return wallet
}

export const addWalletIfNonexistent = async ({
  accountUuid,
  type,
  currency,
}: {
  accountUuid: AccountUuid
  type: WalletType
  currency: WalletCurrency
}): Promise<Wallet | ApplicationError> => {
  const wallets = await WalletsRepository().listByAccountUuid(accountUuid)
  if (wallets instanceof Error) return wallets

  const walletOfTypeAndCurrency = wallets.find(
    (wallet) => wallet.currency === currency && wallet.type === type,
  )
  if (walletOfTypeAndCurrency) return walletOfTypeAndCurrency

  return WalletsRepository().persistNew({
    accountUuid,
    type,
    currency,
  })
}
