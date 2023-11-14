import { Wallets } from "@/app"

import { ZERO_SATS } from "@/domain/shared"
import { MultipleCurrenciesForSingleCurrencyOperationError } from "@/domain/errors"

import { WalletsRepository } from "@/services/mongoose"

import { createRandomUserAndBtcWallet, createRandomUserAndWallets } from "test/helpers"

describe("getPendingOnChainBalanceForWallets", () => {
  describe("with no pending incoming txns", () => {
    it("returns zero balance", async () => {
      const newWalletDescriptor = await createRandomUserAndBtcWallet()
      const wallet = await WalletsRepository().findById(newWalletDescriptor.id)
      if (wallet instanceof Error) throw wallet

      const res = await Wallets.getPendingIncomingOnChainBalanceForWallets([wallet])
      expect(res).toStrictEqual({ [newWalletDescriptor.id]: ZERO_SATS })
    })

    it("returns error for mixed wallet currencies", async () => {
      const { btcWalletDescriptor: newWalletDescriptor, usdWalletDescriptor } =
        await createRandomUserAndWallets()

      const btcWallet = await WalletsRepository().findById(newWalletDescriptor.id)
      if (btcWallet instanceof Error) throw btcWallet
      const usdWallet = await WalletsRepository().findById(usdWalletDescriptor.id)
      if (usdWallet instanceof Error) throw usdWallet

      const res = await Wallets.getPendingIncomingOnChainBalanceForWallets([
        btcWallet,
        usdWallet,
      ])
      expect(res).toBeInstanceOf(MultipleCurrenciesForSingleCurrencyOperationError)
    })

    it("returns error for no wallets passed", async () => {
      const res = await Wallets.getPendingIncomingOnChainBalanceForWallets([])
      expect(res).toBeInstanceOf(MultipleCurrenciesForSingleCurrencyOperationError)
    })
  })
})
