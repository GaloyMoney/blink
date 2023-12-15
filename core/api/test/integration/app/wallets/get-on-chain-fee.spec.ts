import { Wallets } from "@/app"

import { getOnChainWalletConfig } from "@/config"

import { PayoutSpeed } from "@/domain/bitcoin/onchain"
import { LessThanDustThresholdError } from "@/domain/errors"

import { AccountsRepository } from "@/services/mongoose"

import { createRandomUserAndWallets } from "test/helpers"

let outsideAddress: OnChainAddress

beforeAll(async () => {
  outsideAddress = "bcrt1qs758ursh4q9z627kt3pp5yysm78ddny6txaqgw" as OnChainAddress
})

const amountBelowDustThreshold = getOnChainWalletConfig().dustThreshold - 1

describe("onChainPay", () => {
  describe("settles onchain", () => {
    it("fails to fetch fee for dust amount", async () => {
      const { btcWalletDescriptor, usdWalletDescriptor } =
        await createRandomUserAndWallets()
      const account = await AccountsRepository().findById(btcWalletDescriptor.accountId)
      if (account instanceof Error) throw account

      const resultBtcWallet = await Wallets.getOnChainFeeForBtcWallet({
        walletId: btcWalletDescriptor.id,
        account,
        address: outsideAddress,
        amount: amountBelowDustThreshold,
        speed: PayoutSpeed.Fast,
      })
      expect(resultBtcWallet).toBeInstanceOf(LessThanDustThresholdError)

      const resultUsdWallet = await Wallets.getOnChainFeeForUsdWallet({
        walletId: usdWalletDescriptor.id,
        account,
        address: outsideAddress,
        amount: 1,
        speed: PayoutSpeed.Fast,
      })
      expect(resultUsdWallet).toBeInstanceOf(LessThanDustThresholdError)

      const resultUsdWalletAndBtcAmount =
        await Wallets.getOnChainFeeForUsdWalletAndBtcAmount({
          walletId: usdWalletDescriptor.id,
          account,
          address: outsideAddress,
          amount: amountBelowDustThreshold,
          speed: PayoutSpeed.Fast,
        })
      expect(resultUsdWalletAndBtcAmount).toBeInstanceOf(LessThanDustThresholdError)
    })
  })
})
