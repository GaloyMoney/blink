import * as Accounts from "@app/accounts"
import * as Users from "@app/users"
import { setupMongoConnection } from "@services/mongodb"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { WalletCurrency, WalletType } from "@services/mongoose/schema"
import mongoose from "mongoose"

let mongoose_connection

beforeAll(async () => {
  mongoose_connection = await setupMongoConnection()
  await mongoose_connection.connection.db.dropCollection("users")
  await mongoose_connection.connection.db.dropCollection("wallets")
})

afterAll(async () => {
  await mongoose_connection.connection.close()
})

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
