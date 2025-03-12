import { getWalletFromAccount } from "./get-wallet-from-account"

import { checkedToUsername } from "@/domain/accounts"
import { checkedToPhoneNumber } from "@/domain/users"
import { AccountsRepository, UsersRepository } from "@/services/mongoose"

export const getDefaultWalletByUsernameOrPhone = async (
  value: Username | PhoneNumber,
  walletCurrency?: WalletCurrency,
): Promise<Wallet | RepositoryError> => {
  const checkedUsername = checkedToUsername(value)
  if (!(checkedUsername instanceof Error)) {
    const account = await AccountsRepository().findByUsername(checkedUsername)
    if (account instanceof Error) return account
    return getWalletFromAccount(account, walletCurrency, value)
  }

  const checkedPhoneNumber = checkedToPhoneNumber(value)
  if (checkedPhoneNumber instanceof Error) return checkedPhoneNumber

  const user = await UsersRepository().findByPhone(checkedPhoneNumber)
  if (user instanceof Error) return user

  const account = await AccountsRepository().findByUserId(user.id)
  if (account instanceof Error) return account

  return getWalletFromAccount(account, walletCurrency, value)
}
