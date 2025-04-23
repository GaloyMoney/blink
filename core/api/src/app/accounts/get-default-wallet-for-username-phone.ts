import { getWalletFromAccount } from "./get-wallet-from-account"
import { createInvitedAccountFromPhone } from "./create-account"

import {
  CouldNotFindUserFromPhoneError,
  CouldNotFindWalletFromUsernameAndCurrencyError,
} from "@/domain/errors"
import { checkedToUsername } from "@/domain/accounts"
import { checkedToPhoneNumber } from "@/domain/users"
import { AccountsRepository, UsersRepository } from "@/services/mongoose"

export const getDefaultWalletByUsernameOrPhone = async (
  usernameOrPhone: Username | PhoneNumber,
  walletCurrency?: WalletCurrency,
): Promise<Wallet | ApplicationError> => {
  const username = checkedToUsername(usernameOrPhone)
  if (!(username instanceof Error)) {
    const wallet = await getWalletByUsername(username, walletCurrency)
    // we need to do this because previously username allowed valid phone numbers
    if (!(wallet instanceof Error)) return wallet
  }

  const phone = checkedToPhoneNumber(usernameOrPhone)
  if (phone instanceof Error) {
    return new CouldNotFindWalletFromUsernameAndCurrencyError(usernameOrPhone)
  }

  return getWalletByPhone(phone, walletCurrency)
}

const getWalletByUsername = async (
  username: Username,
  walletCurrency?: WalletCurrency,
): Promise<Wallet | ApplicationError> => {
  const account = await AccountsRepository().findByUsername(username)
  if (account instanceof Error) return account

  return getWalletFromAccount(account, walletCurrency)
}

const getWalletByPhone = async (
  phone: PhoneNumber,
  walletCurrency?: WalletCurrency,
): Promise<Wallet | ApplicationError> => {
  const user = await UsersRepository().findByPhone(phone)

  if (user instanceof CouldNotFindUserFromPhoneError) {
    const account = await createInvitedAccountFromPhone({ phone })
    if (account instanceof Error) return account

    return getWalletFromAccount(account, walletCurrency)
  }

  if (user instanceof Error) return user

  const account = await AccountsRepository().findByUserId(user.id)
  if (account instanceof Error) return account

  return getWalletFromAccount(account, walletCurrency)
}
