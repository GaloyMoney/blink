import mongoose from "mongoose"

import { Accounts } from "@/app"
import { WalletCurrency } from "@/domain/shared"
import { WalletType } from "@/domain/wallets"
import { WalletsRepository } from "@/services/mongoose"

import {
  createUserAndWalletFromPhone,
  getAccountByPhone,
  getUsdWalletIdByPhone,
  randomPhone,
} from "test/helpers"

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
  const phone = randomPhone()

  await createUserAndWalletFromPhone(phone)
  const account = await getAccountByPhone(phone)
  const usdWalletId = await getUsdWalletIdByPhone(phone)
  expect(usdWalletId).toBeDefined()

  const newWallet = await Accounts.addWalletIfNonexistent({
    accountId: account.id,
    type: WalletType.Checking,
    currency: WalletCurrency.Usd,
  })
  if (newWallet instanceof Error) throw newWallet

  expect(newWallet.id).toBe(usdWalletId)
})
