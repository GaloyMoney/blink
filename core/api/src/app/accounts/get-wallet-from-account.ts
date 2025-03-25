import { CouldNotFindWalletFromUsernameAndCurrencyError } from "@/domain/errors"
import { WalletsRepository } from "@/services/mongoose"

export const getWalletFromAccount = async (
  account: Account,
  walletCurrency?: WalletCurrency,
  usernameOrPhone?: Username | PhoneNumber,
): Promise<Wallet | ApplicationError> => {
  const wallets = await WalletsRepository().listByAccountId(account.id)
  if (wallets instanceof Error) return wallets

  if (!walletCurrency) {
    return (
      wallets.find((wallet) => wallet.id === account.defaultWalletId) ??
      new CouldNotFindWalletFromUsernameAndCurrencyError(usernameOrPhone)
    )
  }

  return (
    wallets.find((wallet) => wallet.currency === walletCurrency) ??
    new CouldNotFindWalletFromUsernameAndCurrencyError(usernameOrPhone)
  )
}
