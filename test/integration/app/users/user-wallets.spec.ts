import { Users } from "@app"
import { AccountStatus } from "@domain/accounts"
import { WalletCurrency } from "@domain/shared"
import { WalletsRepository } from "@services/mongoose"

import getUuidByString from "uuid-by-string"

const randomPhoneNumber = () => {
  const numDigits = 14
  return `+${Math.floor(Math.random() * 10 ** numDigits)}` as PhoneNumber
}

const randomKratosId = () => {
  return getUuidByString(randomPhoneNumber()) as KratosUserId
}

describe("Users - wallets", () => {
  describe("with 'createUser'", () => {
    it("adds a USD wallet for new user if config is set to true", async () => {
      const hasUsdWallet = true

      const user = await Users.createUserForPhoneSchema({
        newUserInfo: { phone: randomPhoneNumber() },
        config: { initialStatus: AccountStatus.Active, hasUsdWallet },
      })
      if (user instanceof Error) throw user

      const wallets = await WalletsRepository().listByAccountId(user.defaultAccountId)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(2)
      expect(walletCurrencies).toContain(WalletCurrency.Btc)
      expect(walletCurrencies).toContain(WalletCurrency.Usd)
    })

    it("does not add a USD wallet for new user if config is set to false", async () => {
      const hasUsdWallet = false

      const user = await Users.createUserForPhoneSchema({
        newUserInfo: { phone: randomPhoneNumber() },
        config: { initialStatus: AccountStatus.Active, hasUsdWallet },
      })
      if (user instanceof Error) throw user

      const wallets = await WalletsRepository().listByAccountId(user.defaultAccountId)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(1)
      expect(walletCurrencies).toContain(WalletCurrency.Btc)
      expect(walletCurrencies).not.toContain(WalletCurrency.Usd)
    })
  })

  describe("with 'createUserForEmailSchema'", () => {
    it("adds a USD wallet for new user if config is set to true", async () => {
      const hasUsdWallet = true

      const user = await Users.createUserForEmailSchema({
        kratosUserId: randomKratosId(),
        config: { initialStatus: AccountStatus.Active, hasUsdWallet },
      })
      if (user instanceof Error) throw user

      const wallets = await WalletsRepository().listByAccountId(user.defaultAccountId)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(2)
      expect(walletCurrencies).toContain(WalletCurrency.Btc)
      expect(walletCurrencies).toContain(WalletCurrency.Usd)
    })

    it("does not add a USD wallet for new user if config is set to false", async () => {
      const hasUsdWallet = false

      const user = await Users.createUserForEmailSchema({
        kratosUserId: randomKratosId(),
        config: { initialStatus: AccountStatus.Active, hasUsdWallet },
      })
      if (user instanceof Error) throw user

      const wallets = await WalletsRepository().listByAccountId(user.defaultAccountId)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(1)
      expect(walletCurrencies).toContain(WalletCurrency.Btc)
      expect(walletCurrencies).not.toContain(WalletCurrency.Usd)
    })
  })
})
