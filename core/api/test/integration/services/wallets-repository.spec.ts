import {
  CouldNotFindWalletFromAccountIdAndCurrencyError,
  MultipleWalletsFoundForAccountIdAndCurrency,
  RepositoryError,
} from "@/domain/errors"
import { WalletCurrency } from "@/domain/shared"
import { WalletsRepository } from "@/services/mongoose"
import { Wallet } from "@/services/mongoose/schema"
import { toObjectId } from "@/services/mongoose/utils"

const wallets = WalletsRepository()
const accountId = "00112233445566778899aabb" as AccountId

const newWallet = async (currency: string) => {
  const wallet = new Wallet({
    _accountId: toObjectId<AccountId>(accountId),
    type: "checking",
    currency,
  })
  await wallet.save()
}

afterEach(async () => {
  await Wallet.deleteMany({ _accountId: toObjectId<AccountId>(accountId) })
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
})
