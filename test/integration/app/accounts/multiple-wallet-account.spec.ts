import { Accounts } from "@app"
import { getDefaultAccountsConfig } from "@config"
import { WalletCurrency } from "@domain/shared"
import { WalletType } from "@domain/wallets"
import { AuthWithPhonePasswordlessService } from "@services/kratos"
import { WalletsRepository } from "@services/mongoose"
import mongoose from "mongoose"

import {
  createUserAndWalletFromUserRef,
  getAccountByTestUserRef,
  getUsdWalletIdByTestUserRef,
} from "test/helpers"

it("change default walletId of account", async () => {
  const phone = "+123456789" as PhoneNumber

  const authService = AuthWithPhonePasswordlessService()

  const kratosResult = await authService.createIdentityWithSession(phone)

  if (kratosResult instanceof Error) throw kratosResult
  const kratosUserId = kratosResult.kratosUserId

  const account = await Accounts.createAccountWithPhoneIdentifier({
    newAccountInfo: { phone, kratosUserId },
    config: getDefaultAccountsConfig(),
  })
  if (account instanceof Error) throw account

  const accountId = account.id

  const newWallet = await WalletsRepository().persistNew({
    accountId,
    type: WalletType.Checking,
    currency: WalletCurrency.Btc,
  })
  if (newWallet instanceof Error) throw newWallet

  const newAccount = await Accounts.updateDefaultWalletId({
    accountId: accountId,
    walletId: newWallet.id,
  })

  if (newAccount instanceof Error) throw newAccount

  expect(newAccount.defaultWalletId).toBe(newWallet.id)
})

it("fail to create an invalid account", async () => {
  const id = new mongoose.Types.ObjectId()

  const newWallet = await WalletsRepository().persistNew({
    accountId: id as unknown as AccountId,
    type: WalletType.Checking,
    currency: WalletCurrency.Btc,
  })

  expect(newWallet).toBeInstanceOf(Error)
})

it("does not add a usd wallet if one exists", async () => {
  await createUserAndWalletFromUserRef("A")
  const account = await getAccountByTestUserRef("A")
  const usdWalletId = await getUsdWalletIdByTestUserRef("A")
  expect(usdWalletId).toBeDefined()

  const newWallet = await Accounts.addWalletIfNonexistent({
    accountId: account.id,
    type: WalletType.Checking,
    currency: WalletCurrency.Usd,
  })
  if (newWallet instanceof Error) throw newWallet

  expect(newWallet.id).toBe(usdWalletId)
})
