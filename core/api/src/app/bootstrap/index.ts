import { randomUUID } from "crypto"

import { createAccountWithPhoneIdentifier } from "@/app/accounts"

import { ConfigError, getAdminAccounts, getDefaultAccountsConfig } from "@/config"

import { CouldNotFindAccountFromKratosIdError, CouldNotFindError } from "@/domain/errors"
import { WalletCurrency } from "@/domain/shared"

import { initialStaticAccountUuids } from "@/services/ledger/facade"
import {
  AccountsRepository,
  UsersRepository,
  WalletsRepository,
} from "@/services/mongoose"
import { Account } from "@/services/mongoose/schema"

export const randomUserId = () => randomUUID() as UserId

const adminUsers = getAdminAccounts()

export const bootstrap = async () => {
  const adminAccountUuids = await initialStaticAccountUuids()

  for (const accountNameString of Object.keys(adminAccountUuids)) {
    const accountName = accountNameString as keyof InitialStaticAccountUuids
    const accountId = adminAccountUuids[accountName]
    if (!(accountId instanceof Error)) continue

    let adminConfig: AdminAccount | undefined = undefined
    switch (accountName) {
      case "bankOwnerAccountUuid":
        adminConfig = adminUsers.find((val) => val.role === "bankowner")
        break

      case "dealerBtcAccountUuid":
      case "dealerUsdAccountUuid":
        adminConfig = adminUsers.find((val) => val.role === "dealer")
        break

      case "funderAccountUuid":
        adminConfig = adminUsers.find((val) => val.role === "funder")
        break
    }
    if (adminConfig === undefined) {
      return new ConfigError("Missing required admin account config")
    }

    const { phone, role } = adminConfig
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

    await Account.findOneAndUpdate(
      { uuid: account.uuid },
      { role, contactEnabled: false },
    )

    const wallet = await WalletsRepository().findById(account.defaultWalletId)
    if (wallet instanceof Error) return wallet
    if (wallet.currency !== WalletCurrency.Btc) {
      return new Error("Expected BTC-currency default wallet")
    }
  }
}
