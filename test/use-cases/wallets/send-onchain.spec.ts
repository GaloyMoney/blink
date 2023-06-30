import { Prices, Wallets } from "@app"

import { getAccountLimits, getOnChainWalletConfig, ONE_DAY } from "@config"

import { toSats } from "@domain/bitcoin"
import { DisplayCurrency, toCents } from "@domain/fiat"
import {
  InsufficientBalanceError,
  LessThanDustThresholdError,
  LimitsExceededError,
  SelfPaymentError,
} from "@domain/errors"
import { InvalidZeroAmountPriceRatioInputError } from "@domain/payments"

import { timestampDaysAgo } from "@utils"

import { AccountsRepository } from "@services/mongoose"
import { Transaction } from "@services/ledger/schema"

import {
  AmountCalculator,
  WalletCurrency,
  InvalidBtcPaymentAmountError,
} from "@domain/shared"

import { PayoutSpeed } from "@domain/bitcoin/onchain"

import { DealerPriceService } from "@services/dealer-price"

import {
  createMandatoryUsers,
  createRandomUserAndWallet,
  createRandomUserAndUsdWallet,
  recordReceiveLnPayment,
} from "test/helpers"
import { getBalanceHelper } from "test/helpers/wallet"

let outsideAddress: OnChainAddress

const dealerFns = DealerPriceService()

const calc = AmountCalculator()

beforeAll(async () => {
  await createMandatoryUsers()

  outsideAddress = "bcrt1qs758ursh4q9z627kt3pp5yysm78ddny6txaqgw" as OnChainAddress
})

const amount = toSats(10040)
const btcPaymentAmount: BtcPaymentAmount = {
  amount: BigInt(amount),
  currency: WalletCurrency.Btc,
}

const usdAmount = toCents(210)
const usdPaymentAmount: UsdPaymentAmount = {
  amount: BigInt(usdAmount),
  currency: WalletCurrency.Usd,
}

const receiveAmounts = { btc: calc.mul(btcPaymentAmount, 3n), usd: usdPaymentAmount }

const receiveBankFee = {
  btc: { amount: 100n, currency: WalletCurrency.Btc },
  usd: { amount: 1n, currency: WalletCurrency.Usd },
}

const receiveDisplayAmounts = {
  amountDisplayCurrency: Number(receiveAmounts.usd.amount) as DisplayCurrencyBaseAmount,
  feeDisplayCurrency: Number(receiveBankFee.usd.amount) as DisplayCurrencyBaseAmount,
  displayCurrency: DisplayCurrency.Usd,
}

const amountBelowDustThreshold = getOnChainWalletConfig().dustThreshold - 1

const randomOnChainMemo = () =>
  "this is my onchain memo #" + (Math.random() * 1_000_000).toFixed()

describe("onChainPay", () => {
  describe("common", () => {
    it("fails to send all from empty wallet", async () => {
      const newWalletDescriptor = await createRandomUserAndWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      const memo = randomOnChainMemo()

      // Execute use-case
      const res = await Wallets.payAllOnChainByWalletId({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: outsideAddress,
        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(res).toBeInstanceOf(InsufficientBalanceError)
      expect(res instanceof Error && res.message).toEqual(`No balance left to send.`)

      // Restore system state
      Transaction.deleteMany({ memo })
    })

    it("fails if 'validatePaymentInput' fails", async () => {
      const amount = -1000

      const memo = randomOnChainMemo()

      const newWalletDescriptor = await createRandomUserAndWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const result = await Wallets.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: outsideAddress,
        amount,

        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(result).toBeInstanceOf(InvalidBtcPaymentAmountError)

      // Restore system state
      Transaction.deleteMany({ memo })
    })
  })

  describe("settles onchain", () => {
    it("fails if builder 'withConversion' step fails", async () => {
      const memo = randomOnChainMemo()

      const newWalletDescriptor = await createRandomUserAndWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const result = await Wallets.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: outsideAddress,
        amount: amountBelowDustThreshold,

        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(result).toBeInstanceOf(LessThanDustThresholdError)

      // Restore system state
      Transaction.deleteMany({ memo })
    })

    it("fails if withdrawal limit hit", async () => {
      const memo = randomOnChainMemo()

      const newWalletDescriptor = await createRandomUserAndWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Get remaining limit
      const timestamp1DayAgo = timestampDaysAgo(ONE_DAY)
      if (timestamp1DayAgo instanceof Error) throw timestamp1DayAgo

      const withdrawalLimit = getAccountLimits({
        level: newAccount.level,
      }).withdrawalLimit
      const withdrawalLimitUsdAmount = {
        amount: BigInt(withdrawalLimit),
        currency: WalletCurrency.Usd,
      }
      const walletPriceRatio = await Prices.getCurrentPriceAsWalletPriceRatio({
        currency: WalletCurrency.Usd,
      })
      if (walletPriceRatio instanceof Error) throw walletPriceRatio
      const withdrawalLimitBtcAmount = walletPriceRatio.convertFromUsd(
        withdrawalLimitUsdAmount,
      )

      // Fund wallet past remaining limit
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: {
          usd: calc.mul(withdrawalLimitUsdAmount, 2n),
          btc: calc.mul(withdrawalLimitBtcAmount, 2n),
        },
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const result = await Wallets.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: outsideAddress,
        amount: Number(withdrawalLimitBtcAmount.amount) + 10_000,

        speed: PayoutSpeed.Fast,
        memo,
      })

      expect(result).toBeInstanceOf(LimitsExceededError)

      // Restore system state
      Transaction.deleteMany({ memo })
    })

    it("fails if has insufficient balance for fee", async () => {
      const memo = randomOnChainMemo()

      const newWalletDescriptor = await createRandomUserAndWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const balance = await getBalanceHelper(newWalletDescriptor.id)

      const result = await Wallets.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: outsideAddress,
        amount: balance,

        speed: PayoutSpeed.Fast,
        memo,
      })

      //should fail because user does not have balance to pay for on-chain fee
      expect(result).toBeInstanceOf(InsufficientBalanceError)

      // Restore system state
      Transaction.deleteMany({ memo })
    })
  })

  describe("settles intraledger", () => {
    it("fails if builder 'withRecipient' step fails", async () => {
      const memo = randomOnChainMemo()

      const newWalletDescriptor = await createRandomUserAndWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      const newWalletIdAddress = await Wallets.createOnChainAddressForBtcWallet({
        walletId: newWalletDescriptor.id,
      })
      if (newWalletIdAddress instanceof Error) throw newWalletIdAddress

      const res = await Wallets.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        amount,
        address: newWalletIdAddress,

        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(res).toBeInstanceOf(SelfPaymentError)

      // Restore system state
      Transaction.deleteMany({ memo })
    })

    it("fails if builder 'withConversion' step fails", async () => {
      const memo = randomOnChainMemo()

      const newWalletDescriptor = await createRandomUserAndWallet()
      const newAccount = await AccountsRepository().findById(
        newWalletDescriptor.accountId,
      )
      if (newAccount instanceof Error) throw newAccount

      const recipientUsdWalletDescriptor = await createRandomUserAndUsdWallet()

      // Fund balance for send
      const receive = await recordReceiveLnPayment({
        walletDescriptor: newWalletDescriptor,
        paymentAmount: receiveAmounts,
        bankFee: receiveBankFee,
        displayAmounts: receiveDisplayAmounts,
        memo,
      })
      if (receive instanceof Error) throw receive

      // Execute
      const btcSendAmount = toSats(10)

      const recipientUsdWalletIdAddress = await Wallets.createOnChainAddressForUsdWallet({
        walletId: recipientUsdWalletDescriptor.id,
      })
      if (recipientUsdWalletIdAddress instanceof Error) throw recipientUsdWalletIdAddress

      const usdAmount = await dealerFns.getCentsFromSatsForImmediateBuy({
        amount: BigInt(btcSendAmount),
        currency: WalletCurrency.Btc,
      })
      if (usdAmount instanceof Error) return usdAmount
      const btcSendAmountInUsd = Number(usdAmount.amount)
      expect(btcSendAmountInUsd).toBe(0)

      const res = await Wallets.payOnChainByWalletIdForBtcWallet({
        senderWalletId: newWalletDescriptor.id,
        senderAccount: newAccount,
        address: recipientUsdWalletIdAddress,
        amount: btcSendAmount,

        speed: PayoutSpeed.Fast,
        memo,
      })
      expect(res).toBeInstanceOf(InvalidZeroAmountPriceRatioInputError)

      // Restore system state
      Transaction.deleteMany({ memo })
    })
  })
})
