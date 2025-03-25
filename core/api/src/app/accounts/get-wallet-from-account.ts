import {
  CouldNotFindDefaultWalletForAccount,
  CouldNotFindWalletForCurrency
} from "@/domain/errors"
import { WalletsRepository } from "@/services/mongoose"

export const getWalletFromAccount = async (
  account: Account,
  walletCurrency?: WalletCurrency,
): Promise<Wallet | ApplicationError> => {
  const wallets = await WalletsRepository().listByAccountId(account.id)
  if (wallets instanceof Error) return wallets

  if (!walletCurrency) {
    return (
      wallets.find((wallet) => wallet.id === account.defaultWalletId) ??
      new CouldNotFindDefaultWalletForAccount(account.id)
    )
  }

  return (
    wallets.find((wallet) => wallet.currency === walletCurrency) ??
    new CouldNotFindWalletForCurrency(walletCurrency)
  )
}
