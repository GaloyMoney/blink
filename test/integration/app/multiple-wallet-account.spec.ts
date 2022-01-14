import { addWallet, getAccount, setDefaultWalletId } from "@app/accounts"
import { listWalletIdsByAccountId, WalletCurrency, WalletType } from "@domain/wallets"
import { setupMongoConnection } from "@services/mongodb"

import {
  createUserWallet,
  getAccountIdByTestUserIndex,
  getDefaultWalletIdByTestUserIndex,
  getUserTypeByTestUserIndex,
} from "test/helpers"

let walletId0: WalletId
let walletIdNew: WalletId
let accountId0: AccountId

let mongoose

beforeAll(async () => {
  mongoose = await setupMongoConnection()
  await mongoose.connection.db.dropCollection("users")
  await mongoose.connection.db.dropCollection("wallets")

  await createUserWallet(0)

  walletId0 = await getDefaultWalletIdByTestUserIndex(0)
  accountId0 = await getAccountIdByTestUserIndex(0)
})

afterAll(async () => {
  await mongoose.connection.close()
})

it("add a wallet to account0", async () => {
  const wallet = await addWallet({
    accountId: accountId0,
    type: WalletType.Checking,
    currency: WalletCurrency.Btc,
  })
  if (wallet instanceof Error) return Error

  expect(wallet).toBeTruthy()
  expect(walletId0).not.toBe(wallet.id)

  walletIdNew = wallet.id

  const userType0 = await getUserTypeByTestUserIndex(0)
  expect(userType0.defaultWalletId).toBe(walletId0)

  const walletIds = await listWalletIdsByAccountId(accountId0)
  if (walletIds instanceof Error) throw walletIds

  expect(walletIds).toEqual([walletId0, wallet.id])
})

it("change default walletId of account0", async () => {
  const account = await getAccount(accountId0)
  if (account instanceof Error) throw account

  expect(account.defaultWalletId).toBe(walletId0)

  await setDefaultWalletId({ accountId: accountId0, walletId: walletIdNew })
  const newAccount = await getAccount(accountId0)
  if (newAccount instanceof Error) throw newAccount

  expect(newAccount.defaultWalletId).toBe(walletIdNew)
  expect(newAccount.defaultWalletId).not.toBe(walletId0)
})
