import { Accounts } from "@/app"
import { WalletCurrency } from "@/domain/shared"
import { WalletType } from "@/domain/wallets"

import {
  createUserAndWalletFromPhone,
  getAccountByPhone,
  getUsdWalletIdByPhone,
  randomPhone,
} from "test/helpers"

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
