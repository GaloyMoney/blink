import { Accounts } from "@/app"

import { AccountLevel, AccountStatus } from "@/domain/accounts"
import {
  CouldNotFindCurrencyFromCountryError,
  UnknownPriceServiceError,
} from "@/domain/price"
import * as CurrencyFromCountryImpl from "@/domain/price"
import { WalletCurrency } from "@/domain/shared"

import { AccountsRepository, WalletsRepository } from "@/services/mongoose"
import * as PriceImpl from "@/services/price"

import { randomPhone, randomUserId } from "test/helpers"

describe("createAccountWithPhoneIdentifier", () => {
  describe("initialWallets", () => {
    it("adds a USD wallet for new user if config is set to true", async () => {
      const initialWallets = [WalletCurrency.Btc, WalletCurrency.Usd]

      let account = await Accounts.createAccountWithPhoneIdentifier({
        newAccountInfo: { phone: randomPhone(), kratosUserId: randomUserId() },
        config: {
          initialLevel: AccountLevel.One,
          initialStatus: AccountStatus.Active,
          initialWallets,
          maxDeletions: 2,
        },
      })
      if (account instanceof Error) throw account

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

      let account: Account | RepositoryError =
        await Accounts.createAccountWithPhoneIdentifier({
          newAccountInfo: { phone: randomPhone(), kratosUserId: randomUserId() },
          config: {
            initialLevel: AccountLevel.One,
            initialStatus: AccountStatus.Active,
            initialWallets,
            maxDeletions: 2,
          },
        })
      if (account instanceof Error) throw account

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

      let account: Account | RepositoryError =
        await Accounts.createAccountWithPhoneIdentifier({
          newAccountInfo: { phone: randomPhone(), kratosUserId: randomUserId() },
          config: {
            initialLevel: AccountLevel.One,
            initialStatus: AccountStatus.Active,
            initialWallets,
            maxDeletions: 2,
          },
        })
      if (account instanceof Error) throw account

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
      expect(account.displayCurrency).toEqual("USD")
    })

    it("sets displayCurrency based on country code", async () => {
      const initialWallets = [WalletCurrency.Btc]

      let account: Account | RepositoryError =
        await Accounts.createAccountWithPhoneIdentifier({
          newAccountInfo: { phone: randomPhone(), kratosUserId: randomUserId() },
          config: {
            initialLevel: AccountLevel.One,
            initialStatus: AccountStatus.Active,
            initialWallets,
            maxDeletions: 2,
          },
          phoneMetadata: {
            carrier: {
              error_code: null,
              mobile_country_code: null,
              mobile_network_code: null,
              name: null,
              type: null,
            },
            countryCode: "AD", // Andorra
          },
        })
      if (account instanceof Error) throw account

      // Check expected default display currency was set
      account = await AccountsRepository().findById(account.id)
      if (account instanceof Error) throw account
      expect(account.displayCurrency).toEqual("EUR")
    })

    it("sets default display currency if price service errors", async () => {
      // Setup mocks
      const { PriceService: PriceServiceOrig } = jest.requireActual("@/services/price")
      const priceServiceSpy = jest.spyOn(PriceImpl, "PriceService").mockReturnValue({
        ...PriceServiceOrig(),
        listCurrencies: () => new UnknownPriceServiceError(),
      })

      const initialWallets = [WalletCurrency.Btc]

      let account: Account | RepositoryError =
        await Accounts.createAccountWithPhoneIdentifier({
          newAccountInfo: { phone: randomPhone(), kratosUserId: randomUserId() },
          config: {
            initialLevel: AccountLevel.One,
            initialStatus: AccountStatus.Active,
            initialWallets,
            maxDeletions: 2,
          },
          phoneMetadata: {
            carrier: {
              error_code: null,
              mobile_country_code: null,
              mobile_network_code: null,
              name: null,
              type: null,
            },
            countryCode: "AD", // Andorra
          },
        })
      if (account instanceof Error) throw account

      // Check expected default display currency was set
      account = await AccountsRepository().findById(account.id)
      if (account instanceof Error) throw account
      expect(account.displayCurrency).toEqual("USD")

      // Restore system state
      priceServiceSpy.mockRestore()
    })

    it("sets default display currency if currency selection errors", async () => {
      // Setup mocks
      const currencyFromCountrySpy = jest
        .spyOn(CurrencyFromCountryImpl, "displayCurrencyFromCountryCode")
        .mockReturnValue(new CouldNotFindCurrencyFromCountryError())

      const initialWallets = [WalletCurrency.Btc]

      let account: Account | RepositoryError =
        await Accounts.createAccountWithPhoneIdentifier({
          newAccountInfo: { phone: randomPhone(), kratosUserId: randomUserId() },
          config: {
            initialLevel: AccountLevel.One,
            initialStatus: AccountStatus.Active,
            initialWallets,
            maxDeletions: 2,
          },
          phoneMetadata: {
            carrier: {
              error_code: null,
              mobile_country_code: null,
              mobile_network_code: null,
              name: null,
              type: null,
            },
            countryCode: "AD", // Andorra
          },
        })
      if (account instanceof Error) throw account

      // Check expected default display currency was set
      account = await AccountsRepository().findById(account.id)
      if (account instanceof Error) throw account
      expect(account.displayCurrency).toEqual("USD")

      // Restore system state
      currencyFromCountrySpy.mockRestore()
    })
  })
})
