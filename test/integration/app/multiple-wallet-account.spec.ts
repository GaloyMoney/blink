import * as Accounts from "@app/accounts"
import * as Users from "@app/users"
import { setupMongoConnection } from "@services/mongodb"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"
import { WalletCurrency, WalletType } from "@services/mongoose/schema"

let mongoose

beforeAll(async () => {
  mongoose = await setupMongoConnection()
  await mongoose.connection.db.dropCollection("users")
  await mongoose.connection.db.dropCollection("wallets")
})

afterAll(async () => {
  await mongoose.connection.close()
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
