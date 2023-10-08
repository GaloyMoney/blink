import mongoose from "mongoose"

import { Accounts } from "@/app"
import { getDefaultAccountsConfig } from "@/config"
import { WalletCurrency } from "@/domain/shared"
import { WalletType } from "@/domain/wallets"
import { WalletsRepository } from "@/services/mongoose"

import {
  createUserAndWalletFromPhone,
  getAccountByPhone,
  getUsdWalletIdByPhone,
  randomPhone,
  randomUserId,
} from "test/helpers"

it("change default walletId of account", async () => {
  const phone = randomPhone()

  const kratosUserId = randomUserId()

  const account = await Accounts.createAccountWithPhoneIdentifier({
    newAccountInfo: { phone, kratosUserId },
    config: getDefaultAccountsConfig(),
  })
  if (account instanceof Error) throw account

  const accountUuid = account.uuid

  const newWallet = await WalletsRepository().persistNew({
    accountUuid,
    type: WalletType.Checking,
    currency: WalletCurrency.Btc,
  })
  if (newWallet instanceof Error) throw newWallet

  const newAccount = await Accounts.updateDefaultWalletId({
    accountUuid,
    walletId: newWallet.id,
  })

  if (newAccount instanceof Error) throw newAccount

  expect(newAccount.defaultWalletId).toBe(newWallet.id)
})

it("fail to create an invalid account", async () => {
  const id = new mongoose.Types.ObjectId()

  const newWallet = await WalletsRepository().persistNew({
    accountUuid: id as unknown as AccountUuid,
    type: WalletType.Checking,
    currency: WalletCurrency.Btc,
  })

  expect(newWallet).toBeInstanceOf(Error)
})

it("does not add a usd wallet if one exists", async () => {
  const phone = randomPhone()

  await createUserAndWalletFromPhone(phone)
  const account = await getAccountByPhone(phone)
  const usdWalletId = await getUsdWalletIdByPhone(phone)
  expect(usdWalletId).toBeDefined()

  const newWallet = await Accounts.addWalletIfNonexistent({
    accountUuid: account.uuid,
    type: WalletType.Checking,
    currency: WalletCurrency.Usd,
  })
  if (newWallet instanceof Error) throw newWallet

  expect(newWallet.id).toBe(usdWalletId)
})
