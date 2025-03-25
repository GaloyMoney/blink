import { getWalletFromAccount } from "./get-wallet-from-account"

import { CouldNotFindWalletFromUsernameAndCurrencyError } from "@/domain/errors"
import { checkedToUsername } from "@/domain/accounts"
import { checkedToPhoneNumber } from "@/domain/users"
import { AccountsRepository, UsersRepository } from "@/services/mongoose"

export const getDefaultWalletByUsernameOrPhone = async (
  usernameOrPhone: Username | PhoneNumber,
  walletCurrency?: WalletCurrency,
): Promise<Wallet | ApplicationError> => {
  const checkedUsername = checkedToUsername(usernameOrPhone)
  if (!(checkedUsername instanceof Error)) {
    const account = await AccountsRepository().findByUsername(checkedUsername)
    if (account instanceof Error) return account
    return getWalletFromAccount(account, walletCurrency, usernameOrPhone)
  }

  const checkedPhoneNumber = checkedToPhoneNumber(usernameOrPhone)
  if (checkedPhoneNumber instanceof Error)
    return new CouldNotFindWalletFromUsernameAndCurrencyError(checkedPhoneNumber)

  const user = await UsersRepository().findByPhone(checkedPhoneNumber)
  if (user instanceof Error) return user

  const account = await AccountsRepository().findByUserId(user.id)
  if (account instanceof Error) return account

  return getWalletFromAccount(account, walletCurrency, usernameOrPhone)
}
