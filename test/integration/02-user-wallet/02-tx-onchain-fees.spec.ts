import { Wallets, Payments } from "@app"
import { getFeesConfig, getOnChainWalletConfig } from "@config"
import { toSats, toTargetConfs } from "@domain/bitcoin"
import { InsufficientBalanceError, LessThanDustThresholdError } from "@domain/errors"
import { toCents } from "@domain/fiat"
import { WalletCurrency } from "@domain/shared"
import { DealerPriceService } from "@services/dealer-price"
import { AccountsRepository, WalletsRepository } from "@services/mongoose"

import {
  bitcoindClient,
  bitcoindOutside,
  createUserAndWalletFromUserRef,
  getAccountByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getUsdWalletIdByTestUserRef,
} from "test/helpers"

const defaultAmount = toSats(6000)
const defaultUsdAmount = toSats(105)
const defaultTarget = toTargetConfs(3)
const { dustThreshold } = getOnChainWalletConfig()
let walletIdA: WalletId, walletIdB: WalletId, walletIdUsdA: WalletId, accountA: Account

beforeAll(async () => {
  await bitcoindClient.loadWallet({ filename: "outside" })

  await createUserAndWalletFromUserRef("A")
  await createUserAndWalletFromUserRef("B")

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  walletIdUsdA = await getUsdWalletIdByTestUserRef("A")
  accountA = await getAccountByTestUserRef("A")
  walletIdB = await getDefaultWalletIdByTestUserRef("B")
})

afterAll(async () => {
  await bitcoindClient.unloadWallet({ walletName: "outside" })
})

describe("UserWallet - getOnchainFee", () => {
  describe("from btc wallet", () => {
    it("returns a fee greater than zero for an external address", async () => {
      const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
      const feeAmount = await Wallets.getOnChainFee({
        walletId: walletIdA,
        account: accountA,
        amount: defaultAmount,
        address,
        targetConfirmations: defaultTarget,
      })
      if (feeAmount instanceof Error) throw feeAmount
      expect(feeAmount.currency === WalletCurrency.Btc)
      const fee = Number(feeAmount.amount)
      expect(fee).toBeGreaterThan(0)

      const wallet = await WalletsRepository().findById(walletIdA)
      if (wallet instanceof Error) throw wallet

      const account = await AccountsRepository().findById(wallet.accountId)
      if (account instanceof Error) throw account

      expect(fee).toBeGreaterThan(account.withdrawFee)
    })

    it("returns zero for an on us address", async () => {
      const address = await Wallets.createOnChainAddress(walletIdB)
      if (address instanceof Error) throw address
      const feeAmount = await Wallets.getOnChainFee({
        walletId: walletIdA,
        account: accountA,
        amount: defaultAmount,
        address,
        targetConfirmations: defaultTarget,
      })
      if (feeAmount instanceof Error) throw feeAmount
      const fee = Number(feeAmount.amount)
      expect(fee).toBe(0)
    })

    it("returns error for dust amount", async () => {
      const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
      const amount = toSats(dustThreshold - 1)
      const fee = await Wallets.getOnChainFee({
        walletId: walletIdA,
        account: accountA,
        amount,
        address,
        targetConfirmations: defaultTarget,
      })
      expect(fee).toBeInstanceOf(LessThanDustThresholdError)
      expect(fee).toHaveProperty(
        "message",
        `Use lightning to send amounts less than ${dustThreshold} sats`,
      )
    })

    it("returns error for minimum amount", async () => {
      const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
      const amount = toSats(1)
      const fee = await Wallets.getOnChainFee({
        walletId: walletIdA,
        account: accountA,
        amount,
        address,
        targetConfirmations: defaultTarget,
      })
      expect(fee).toBeInstanceOf(LessThanDustThresholdError)
      expect(fee).toHaveProperty(
        "message",
        `Use lightning to send amounts less than ${dustThreshold} sats`,
      )
    })

    it("returns error for balance too low", async () => {
      const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
      const amount = toSats(1_000_000_000)
      const fee = await Wallets.getOnChainFee({
        walletId: walletIdA,
        account: accountA,
        amount,
        address,
        targetConfirmations: defaultTarget,
      })
      expect(fee).toBeInstanceOf(InsufficientBalanceError)
      expect(fee).toHaveProperty(
        "message",
        expect.stringMatching(/Payment amount '\d+' sats exceeds balance '\d+'/),
      )
    })
  })

  describe("from usd wallet", () => {
    it("returns a fee greater than zero for an external address", async () => {
      const feeRates = getFeesConfig()
      const feeSats = toSats(feeRates.withdrawDefaultMin + 7050)

      // Fund empty USD wallet
      const payResult = await Payments.intraledgerPaymentSendWalletId({
        recipientWalletId: walletIdUsdA,
        memo: "",
        amount: defaultAmount + feeSats,
        senderWalletId: walletIdA,
        senderAccount: accountA,
      })
      if (payResult instanceof Error) throw payResult

      const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
      const feeAmount = await Wallets.getOnChainFee({
        walletId: walletIdUsdA,
        account: accountA,
        amount: defaultUsdAmount,
        address,
        targetConfirmations: defaultTarget,
      })
      if (feeAmount instanceof Error) throw feeAmount
      expect(feeAmount.currency === WalletCurrency.Usd)
      const fee = Number(feeAmount.amount)
      expect(fee).toBeGreaterThan(0)

      const wallet = await WalletsRepository().findById(walletIdUsdA)
      if (wallet instanceof Error) throw wallet

      const account = await AccountsRepository().findById(wallet.accountId)
      if (account instanceof Error) throw account

      const withdrawFeeAsUsd =
        await DealerPriceService().getCentsFromSatsForImmediateSell(account.withdrawFee)
      if (withdrawFeeAsUsd instanceof Error) throw withdrawFeeAsUsd
      expect(fee).toBeGreaterThan(withdrawFeeAsUsd)

      const expectedFee = await DealerPriceService().getCentsFromSatsForImmediateSell(
        feeSats,
      )
      if (expectedFee instanceof Error) throw expectedFee
      expect(expectedFee).toEqual(fee)
    })

    it("returns zero for an on us address", async () => {
      const address = await Wallets.createOnChainAddress(walletIdB)
      if (address instanceof Error) throw address
      const feeAmount = await Wallets.getOnChainFee({
        walletId: walletIdUsdA,
        account: accountA,
        amount: defaultUsdAmount,
        address,
        targetConfirmations: defaultTarget,
      })
      if (feeAmount instanceof Error) throw feeAmount
      const fee = Number(feeAmount.amount)
      expect(fee).toBe(0)
    })

    it("returns error for dust amount", async () => {
      const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
      const amount = toSats(dustThreshold - 1)
      const usdAmount = await DealerPriceService().getCentsFromSatsForImmediateBuy(amount)
      if (usdAmount instanceof Error) throw usdAmount

      const fee = await Wallets.getOnChainFee({
        walletId: walletIdUsdA,
        account: accountA,
        amount: usdAmount,
        address,
        targetConfirmations: defaultTarget,
      })
      expect(fee).toBeInstanceOf(LessThanDustThresholdError)
      expect(fee).toHaveProperty(
        "message",
        `Use lightning to send amounts less than ${dustThreshold} sats`,
      )
    })

    it("returns error for minimum amount", async () => {
      const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
      const usdAmount = toCents(1)

      const fee = await Wallets.getOnChainFee({
        walletId: walletIdUsdA,
        account: accountA,
        amount: usdAmount,
        address,
        targetConfirmations: defaultTarget,
      })
      expect(fee).toBeInstanceOf(LessThanDustThresholdError)
      expect(fee).toHaveProperty(
        "message",
        `Use lightning to send amounts less than ${dustThreshold} sats`,
      )
    })

    it("returns error for balance too low", async () => {
      const address = (await bitcoindOutside.getNewAddress()) as OnChainAddress
      const amount = toSats(1_000_000_000)
      const usdAmount = await DealerPriceService().getCentsFromSatsForImmediateBuy(amount)
      if (usdAmount instanceof Error) throw usdAmount

      const fee = await Wallets.getOnChainFee({
        walletId: walletIdUsdA,
        account: accountA,
        amount: usdAmount,
        address,
        targetConfirmations: defaultTarget,
      })
      expect(fee).toBeInstanceOf(InsufficientBalanceError)
      expect(fee).toHaveProperty(
        "message",
        expect.stringMatching(/Payment amount '\d+' cents exceeds balance '\d+'/),
      )
    })
  })
})
