import { randomUUID } from "crypto"

import mongoose from "mongoose"

import {
  CouldNotFindAccountFromIdError,
  CouldNotFindWalletFromAccountIdAndCurrencyError,
  MultipleWalletsFoundForAccountIdAndCurrency,
  RepositoryError,
} from "@/domain/errors"
import { WalletCurrency } from "@/domain/shared"
import { WalletsRepository } from "@/services/mongoose"
import { Wallet } from "@/services/mongoose/schema"
import { WalletType } from "@/domain/wallets"

const wallets = WalletsRepository()
const accountId = randomUUID() as AccountId

const newWallet = async (currency: string) => {
  const wallet = new Wallet({
    accountId,
    type: "checking",
    currency,
  })
  await wallet.save()
}

afterEach(async () => {
  await Wallet.deleteMany({ accountId })
})

describe("WalletsRepository", () => {
  describe("findAccountWalletsByAccountId", () => {
    it("fetches AccountWallets", async () => {
      await newWallet(WalletCurrency.Btc)
      await newWallet(WalletCurrency.Usd)

      const accountWallets = await wallets.findAccountWalletsByAccountId(accountId)
      if (accountWallets instanceof Error) throw accountWallets

      expect(accountWallets).toEqual(
        expect.objectContaining({
          [WalletCurrency.Btc]: expect.objectContaining({ currency: WalletCurrency.Btc }),
          [WalletCurrency.Usd]: expect.objectContaining({ currency: WalletCurrency.Usd }),
        }),
      )
    })

    it("fails if btc wallet missing", async () => {
      await newWallet(WalletCurrency.Usd)

      const accountWallets = await wallets.findAccountWalletsByAccountId(accountId)
      expect(accountWallets).toBeInstanceOf(
        CouldNotFindWalletFromAccountIdAndCurrencyError,
      )
      expect((accountWallets as RepositoryError).message).toBe(WalletCurrency.Btc)
    })

    it("fails if usd wallet missing", async () => {
      await newWallet(WalletCurrency.Btc)

      const accountWallets = await wallets.findAccountWalletsByAccountId(accountId)
      expect(accountWallets).toBeInstanceOf(
        CouldNotFindWalletFromAccountIdAndCurrencyError,
      )
      expect((accountWallets as RepositoryError).message).toBe(WalletCurrency.Usd)
    })

    it("fails if more than 1 btc wallet found", async () => {
      await newWallet(WalletCurrency.Btc)
      await newWallet(WalletCurrency.Btc)
      await newWallet(WalletCurrency.Usd)

      const accountWallets = await wallets.findAccountWalletsByAccountId(accountId)
      expect(accountWallets).toBeInstanceOf(MultipleWalletsFoundForAccountIdAndCurrency)
      expect((accountWallets as RepositoryError).message).toBe(WalletCurrency.Btc)
    })

    it("fails if more than 1 usd wallet found", async () => {
      await newWallet(WalletCurrency.Btc)
      await newWallet(WalletCurrency.Usd)
      await newWallet(WalletCurrency.Usd)

      const accountWallets = await wallets.findAccountWalletsByAccountId(accountId)
      expect(accountWallets).toBeInstanceOf(MultipleWalletsFoundForAccountIdAndCurrency)
      expect((accountWallets as RepositoryError).message).toBe(WalletCurrency.Usd)
    })
  })

  describe("persistNew", () => {
    it("fail to create a wallet with non-existent account", async () => {
      const id = new mongoose.Types.ObjectId()

      const newWallet = await wallets.persistNew({
        accountId: id as unknown as AccountId,
        type: WalletType.Checking,
        currency: WalletCurrency.Btc,
      })
      expect(newWallet).toBeInstanceOf(CouldNotFindAccountFromIdError)
    })
  })
})
