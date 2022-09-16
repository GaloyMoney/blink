import { Users } from "@app"
import { AccountStatus } from "@domain/accounts"
import { WalletCurrency } from "@domain/shared"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"

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
      const initialWallets = [WalletCurrency.Btc, WalletCurrency.Usd]

      const user = await Users.createUserForPhoneSchema({
        newUserInfo: { phone: randomPhoneNumber() },
        config: { initialStatus: AccountStatus.Active, initialWallets },
      })
      if (user instanceof Error) throw user

      // Check all wallets were created
      const wallets = await WalletsRepository().listByAccountId(user.defaultAccountId)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(2)
      expect(walletCurrencies).toContain(WalletCurrency.Btc)
      expect(walletCurrencies).toContain(WalletCurrency.Usd)

      // Check expected default wallet was set
      const account = await AccountsRepository().findById(wallets[0].accountId)
      if (account instanceof Error) throw account

      const btcWallet = wallets.filter(
        (wallet) => wallet.currency === WalletCurrency.Btc,
      )[0]
      if (btcWallet === undefined) {
        throw new Error(`${WalletCurrency.Btc} wallet not found`)
      }
      expect(account.defaultWalletId).toEqual(btcWallet.id)
    })

    it("does not add a USD wallet for new user if config is set to false", async () => {
      const initialWallets = [WalletCurrency.Btc]

      const user = await Users.createUserForPhoneSchema({
        newUserInfo: { phone: randomPhoneNumber() },
        config: { initialStatus: AccountStatus.Active, initialWallets },
      })
      if (user instanceof Error) throw user

      // Check all wallets were created
      const wallets = await WalletsRepository().listByAccountId(user.defaultAccountId)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(1)
      expect(walletCurrencies).toContain(WalletCurrency.Btc)
      expect(walletCurrencies).not.toContain(WalletCurrency.Usd)

      // Check expected default wallet was set
      const account = await AccountsRepository().findById(wallets[0].accountId)
      if (account instanceof Error) throw account

      const btcWallet = wallets.filter(
        (wallet) => wallet.currency === WalletCurrency.Btc,
      )[0]
      if (btcWallet === undefined) {
        throw new Error(`${WalletCurrency.Btc} wallet not found`)
      }
      expect(account.defaultWalletId).toEqual(btcWallet.id)
    })

    it("sets USD wallet as default if BTC wallet does not exist", async () => {
      const initialWallets = [WalletCurrency.Usd]

      const user = await Users.createUserForPhoneSchema({
        newUserInfo: { phone: randomPhoneNumber() },
        config: { initialStatus: AccountStatus.Active, initialWallets },
      })
      if (user instanceof Error) throw user

      // Check all wallets were created
      const wallets = await WalletsRepository().listByAccountId(user.defaultAccountId)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(1)
      expect(walletCurrencies).not.toContain(WalletCurrency.Btc)
      expect(walletCurrencies).toContain(WalletCurrency.Usd)

      // Check expected default wallet was set
      const account = await AccountsRepository().findById(wallets[0].accountId)
      if (account instanceof Error) throw account

      const usdWallet = wallets.filter(
        (wallet) => wallet.currency === WalletCurrency.Usd,
      )[0]
      if (usdWallet === undefined) {
        throw new Error(`${WalletCurrency.Usd} wallet not found`)
      }
      expect(account.defaultWalletId).toEqual(usdWallet.id)
    })
  })

  describe("with 'createUserForEmailSchema'", () => {
    it("adds a USD wallet for new user if config is set to true", async () => {
      const initialWallets = [WalletCurrency.Btc, WalletCurrency.Usd]

      const user = await Users.createUserForEmailSchema({
        kratosUserId: randomKratosId(),
        config: { initialStatus: AccountStatus.Active, initialWallets },
      })
      if (user instanceof Error) throw user

      // Check all wallets were created
      const wallets = await WalletsRepository().listByAccountId(user.defaultAccountId)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(2)
      expect(walletCurrencies).toContain(WalletCurrency.Btc)
      expect(walletCurrencies).toContain(WalletCurrency.Usd)

      // Check expected default wallet was set
      const account = await AccountsRepository().findById(wallets[0].accountId)
      if (account instanceof Error) throw account

      const btcWallet = wallets.filter(
        (wallet) => wallet.currency === WalletCurrency.Btc,
      )[0]
      if (btcWallet === undefined) {
        throw new Error(`${WalletCurrency.Btc} wallet not found`)
      }
      expect(account.defaultWalletId).toEqual(btcWallet.id)
    })

    it("does not add a USD wallet for new user if config is set to false", async () => {
      const initialWallets = [WalletCurrency.Btc]

      const user = await Users.createUserForEmailSchema({
        kratosUserId: randomKratosId(),
        config: { initialStatus: AccountStatus.Active, initialWallets },
      })
      if (user instanceof Error) throw user

      // Check all wallets were created
      const wallets = await WalletsRepository().listByAccountId(user.defaultAccountId)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(1)
      expect(walletCurrencies).toContain(WalletCurrency.Btc)
      expect(walletCurrencies).not.toContain(WalletCurrency.Usd)

      // Check expected default wallet was set
      const account = await AccountsRepository().findById(wallets[0].accountId)
      if (account instanceof Error) throw account

      const btcWallet = wallets.filter(
        (wallet) => wallet.currency === WalletCurrency.Btc,
      )[0]
      if (btcWallet === undefined) {
        throw new Error(`${WalletCurrency.Btc} wallet not found`)
      }
      expect(account.defaultWalletId).toEqual(btcWallet.id)
    })

    it("sets USD wallet as default if BTC wallet does not exist", async () => {
      const initialWallets = [WalletCurrency.Usd]

      const user = await Users.createUserForEmailSchema({
        kratosUserId: randomKratosId(),
        config: { initialStatus: AccountStatus.Active, initialWallets },
      })
      if (user instanceof Error) throw user

      // Check all wallets were created
      const wallets = await WalletsRepository().listByAccountId(user.defaultAccountId)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(1)
      expect(walletCurrencies).not.toContain(WalletCurrency.Btc)
      expect(walletCurrencies).toContain(WalletCurrency.Usd)

      // Check expected default wallet was set
      const account = await AccountsRepository().findById(wallets[0].accountId)
      if (account instanceof Error) throw account

      const usdWallet = wallets.filter(
        (wallet) => wallet.currency === WalletCurrency.Usd,
      )[0]
      if (usdWallet === undefined) {
        throw new Error(`${WalletCurrency.Usd} wallet not found`)
      }
      expect(account.defaultWalletId).toEqual(usdWallet.id)
    })
  })
})
