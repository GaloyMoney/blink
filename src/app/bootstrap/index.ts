import { randomUUID } from "crypto"

import { createAccountWithPhoneIdentifier } from "@app/accounts"

import { getDefaultAccountsConfig } from "@config"

import { adminUsers } from "@domain/admin-users"
import { CouldNotFindAccountFromKratosIdError, CouldNotFindError } from "@domain/errors"
import { WalletCurrency } from "@domain/shared"

import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@services/mongoose"
import { Account } from "@services/mongoose/schema"
import { toObjectId } from "@services/mongoose/utils"

export const randomUserId = () => randomUUID() as UserId

export const bootstrap = async () => {
  for (const entry of adminUsers) {
    const { phone } = entry
    const user = await UsersRepository().findByPhone(phone)
    let kratosUserId: UserId
    if (user instanceof CouldNotFindError) {
      const randomKratosUserId = randomUserId()

      const res = await UsersRepository().update({
        id: randomKratosUserId,
        deviceTokens: [`token-${randomKratosUserId}`] as DeviceToken[],
        phone,
      })
      kratosUserId = randomKratosUserId
      if (res instanceof Error) return res
    } else {
      if (user instanceof Error) return user

      kratosUserId = user.id
    }

    let account = await AccountsRepository().findByUserId(kratosUserId)
    if (account instanceof CouldNotFindAccountFromKratosIdError) {
      account = await createAccountWithPhoneIdentifier({
        newAccountInfo: { phone, kratosUserId },
        config: getDefaultAccountsConfig(),
      })
    }
    if (account instanceof Error) return account

    if (entry.role) {
      const contactEnabled = entry.role === "user" || entry.role === "editor"
      await Account.findOneAndUpdate(
        { _id: toObjectId<AccountId>(account.id) },
        { role: entry.role, contactEnabled },
      )
    }

    const wallet = await WalletsRepository().findById(account.defaultWalletId)
    if (wallet instanceof Error) return wallet
    if (wallet.currency !== WalletCurrency.Btc) {
      return new Error("Expected BTC-currency default wallet")
    }
  }

  return true
}
