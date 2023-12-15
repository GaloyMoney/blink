import { WalletCurrency } from "@/domain/shared"
import { AccountsRepository, WalletsRepository } from "@/services/mongoose"

import { createAccount } from "test/helpers"

describe("Users - wallets", () => {
  describe("with 'createUser'", () => {
    it("adds a USD wallet for new user if config is set to true", async () => {
      const initialWallets = [WalletCurrency.Btc, WalletCurrency.Usd]

      let account: Account | RepositoryError = await createAccount({
        initialWallets,
      })

      // Check all wallets were created
      const wallets = await WalletsRepository().listByAccountId(account.id)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(2)
      expect(walletCurrencies).toContain(WalletCurrency.Btc)
      expect(walletCurrencies).toContain(WalletCurrency.Usd)

      // Check expected default wallet was set
      account = await AccountsRepository().findById(wallets[0].accountId)
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

      let account: Account | RepositoryError = await createAccount({
        initialWallets,
      })

      // Check all wallets were created
      const wallets = await WalletsRepository().listByAccountId(account.id)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(1)
      expect(walletCurrencies).toContain(WalletCurrency.Btc)
      expect(walletCurrencies).not.toContain(WalletCurrency.Usd)

      // Check expected default wallet was set
      account = await AccountsRepository().findById(wallets[0].accountId)
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

      let account: Account | RepositoryError = await createAccount({
        initialWallets,
      })

      // Check all wallets were created
      const wallets = await WalletsRepository().listByAccountId(account.id)
      if (wallets instanceof Error) throw wallets
      const walletCurrencies = wallets.map((wallet) => wallet.currency)
      expect(walletCurrencies).toHaveLength(1)
      expect(walletCurrencies).not.toContain(WalletCurrency.Btc)
      expect(walletCurrencies).toContain(WalletCurrency.Usd)

      // Check expected default wallet was set
      account = await AccountsRepository().findById(wallets[0].accountId)
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
