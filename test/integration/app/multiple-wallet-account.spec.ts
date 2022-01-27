import mongoose from "mongoose"
import { Accounts, Users } from "@app"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { WalletCurrency, WalletType } from "@domain/wallets"

it("change default walletId of account", async () => {
  const user = await Users.createUser({ phone: "+123456789", phoneMetadata: null })
  if (user instanceof Error) throw user

  const accountId = user.defaultAccountId
  const account = await AccountsRepository().findById(accountId)

  if (account instanceof Error) throw account

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
