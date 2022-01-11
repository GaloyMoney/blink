import { addWallet, getAccount, setDefaultWalletId } from "@app/accounts"
import { WalletType } from "@domain/wallets"
import { setupMongoConnection } from "@services/mongodb"

import {
  createUserWallet,
  getAccountIdByTestUserIndex,
  getDefaultWalletIdByTestUserIndex,
  getUserTypeByTestUserIndex,
} from "test/helpers"

let walletId0: WalletId
let accountId0: AccountId

let mongoose

beforeAll(async () => {
  mongoose = await setupMongoConnection()
  await mongoose.connection.db.dropCollection("users")

  await createUserWallet(0)

  walletId0 = await getDefaultWalletIdByTestUserIndex(0)
  accountId0 = await getAccountIdByTestUserIndex(0)
})

afterAll(async () => {
  await mongoose.connection.close()
})

it("add a wallet to account0", async () => {
  const wallet = await addWallet({ accountId: accountId0, type: WalletType.CheckingBTC })
  if (wallet instanceof Error) return Error

  expect(wallet).toBeTruthy()
  expect(walletId0).not.toBe(wallet.id)

  const userType0 = await getUserTypeByTestUserIndex(0)
  expect([...userType0.walletIds]).toEqual([walletId0, wallet.id])
  expect(userType0.defaultWalletId).toBe(walletId0)
})

it("change default walletId of account0", async () => {
  const account = await getAccount(accountId0)
  if (account instanceof Error) throw account

  expect(account.defaultWalletId).toBe(walletId0)

  await setDefaultWalletId({ accountId: accountId0, walletId: account.walletIds[1] })
  const newAccount = await getAccount(accountId0)
  if (newAccount instanceof Error) throw newAccount

  expect(newAccount.defaultWalletId).toBe(newAccount.walletIds[1])
  expect(newAccount.defaultWalletId).not.toBe(walletId0)
})
