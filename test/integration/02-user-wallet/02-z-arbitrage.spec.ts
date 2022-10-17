import { Payments, Wallets } from "@app"
import { getMidPriceRatio } from "@app/shared"
import { getDealerConfig } from "@config"

import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { ZeroAmountForUsdRecipientError } from "@domain/payments"
import { AmountCalculator, paymentAmountFromNumber, WalletCurrency } from "@domain/shared"
import { baseLogger } from "@services/logger"
import { AccountsRepository } from "@services/mongoose"

import {
  cancelOkexPricePublish,
  createAndFundNewWalletForPhone,
  getBalanceHelper,
  publishOkexPrice,
  randomPhone,
} from "test/helpers"

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
  return {
    ...config,
    getInvoiceCreateAttemptLimits: jest.fn().mockReturnValue({
      ...config.getInvoiceCreateAttemptLimits(),
      points: 100,
    }),
  }
})

const calc = AmountCalculator()
const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled

const ONE_CENT = { amount: 1n, currency: WalletCurrency.Usd } as UsdPaymentAmount
const ONE_SAT = { amount: 1n, currency: WalletCurrency.Btc } as BtcPaymentAmount

const btcAmountFromUsdNumber = async (
  centsAmount: number | bigint,
): Promise<BtcPaymentAmount> => {
  const usdPaymentAmount = paymentAmountFromNumber({
    amount: Number(centsAmount),
    currency: WalletCurrency.Usd,
  })
  if (usdPaymentAmount instanceof Error) throw usdPaymentAmount

  const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
  if (midPriceRatio instanceof Error) throw midPriceRatio
  return midPriceRatio.convertFromUsd(usdPaymentAmount)
}

beforeAll(async () => {
  await publishOkexPrice()
})

afterAll(async () => {
  cancelOkexPricePublish()
})

describe("arbitrage strategies", () => {
  describe("can pay high sats invoice with $0.01", () => {
    // This strategy is to see if we can generate an invoice for an amount of
    // BTC that when paid from our USD wallet:
    // - rounds to $0.01
    // - is more than the amount of sats to send to USD wallet to get $0.01
    //
    // In the original discovery, the opportunity was possible because we could pay
    // an invoice up to 78 sats for $0.01 from a USD wallet and then convert back
    // to $0.01 for 53 sats.

    it("pay max invoice to btc wallet from usd wallet, replenish $0.01 with usd-denominated invoice", async () => {
      // send-lightning => sender usd wallet => usdFromBtc => expects Sell

      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
      const lnInvoice = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      // Step 2: Pay invoice from USD wallet at favourable rate
      const result = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (result instanceof Error) throw result

      // Step 3: Replenish USD from BTC wallet with $0.01 invoice
      const lnInvoiceUsd = await Wallets.addInvoiceForSelf({
        walletId: newUsdWallet.id,
        amount: toCents(1),
      })
      if (lnInvoiceUsd instanceof Error) throw lnInvoiceUsd

      const resultUsd = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoiceUsd.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (resultUsd instanceof Error) throw resultUsd

      // Step 4: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay max invoice to btc wallet from usd wallet, replenish $0.01 with intraledger payment", async () => {
      // send-lightning => sender usd wallet => usdFromBtc => expects Sell

      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend = startingBtcAmount
      {
        const sendArgs = {
          recipientWalletId: newUsdWallet.id,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        }
        let paid = await Payments.intraledgerPaymentSendWalletId({
          amount: toSats(minBtcAmountToSpend.amount),
          ...sendArgs,
        })
        // Ensure paid is 'Success' for starting amount
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
        // Decrement until paid fails
        while (
          !(paid instanceof ZeroAmountForUsdRecipientError) &&
          minBtcAmountToSpend.amount > 1n
        ) {
          minBtcAmountToSpend = calc.sub(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
        // Increment to discover min BTC amount to sell for $0.01
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            recipientWalletId: newUsdWallet.id,
            memo: null,
            amount: toSats(minBtcAmountToSpend.amount),
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
      const lnInvoice = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      // Step 2: Pay invoice from USD wallet at favourable rate
      const result = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (result instanceof Error) throw result

      // Step 3: Replenish USD from BTC wallet with discovered 'minBtcAmountToSpend' for $0.01
      const paid = await Payments.intraledgerPaymentSendWalletId({
        recipientWalletId: newUsdWallet.id,
        memo: null,
        amount: toSats(minBtcAmountToSpend.amount),
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (paid instanceof Error && !(paid instanceof ZeroAmountForUsdRecipientError)) {
        throw paid
      }

      // Step 4: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay max fee probe to btc wallet from usd wallet, replenish $0.01 with intraledger payment", async () => {
      // probe => sender usd wallet => usdFromBtc => expects Sell
      // send-lightning => sender usd wallet => usdFromBtc => expects Sell
      // send-intraledger => sender btc wallet => usdFromBtc => expects Buy

      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const probeResult = await Payments.getLightningFeeEstimation({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          walletId: newUsdWallet.id,
        })
        if (probeResult instanceof Error) throw probeResult
        const payResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (payResult instanceof Error) throw payResult
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend = startingBtcAmount
      {
        const sendArgs = {
          recipientWalletId: newUsdWallet.id,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        }
        let paid = await Payments.intraledgerPaymentSendWalletId({
          amount: toSats(minBtcAmountToSpend.amount),
          ...sendArgs,
        })
        // Ensure paid is 'Success' for starting amount
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
        // Decrement until paid fails
        while (
          !(paid instanceof ZeroAmountForUsdRecipientError) &&
          minBtcAmountToSpend.amount > 1n
        ) {
          minBtcAmountToSpend = calc.sub(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
        // Increment to discover min BTC amount to sell for $0.01
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            recipientWalletId: newUsdWallet.id,
            memo: null,
            amount: toSats(minBtcAmountToSpend.amount),
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
      const lnInvoice = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      // Step 2: Pay invoice from USD wallet at favourable rate
      const result = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (result instanceof Error) throw result

      // Step 3: Replenish USD from BTC wallet with discovered 'minBtcAmountToSpend' for $0.01
      const paid = await Payments.intraledgerPaymentSendWalletId({
        recipientWalletId: newUsdWallet.id,
        memo: null,
        amount: toSats(minBtcAmountToSpend.amount),
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (paid instanceof Error && !(paid instanceof ZeroAmountForUsdRecipientError)) {
        throw paid
      }

      // Step 4: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay max invoice to btc wallet from usd wallet, replenish $0.01 with no-amount min btc invoice", async () => {
      // send-lightning => sender usd wallet => usdFromBtc => expects Sell

      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend = startingBtcAmount
      {
        const sendArgs = {
          recipientWalletId: newUsdWallet.id,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        }
        let paid = await Payments.intraledgerPaymentSendWalletId({
          amount: toSats(minBtcAmountToSpend.amount),
          ...sendArgs,
        })
        // Ensure paid is 'Success' for starting amount
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
        // Decrement until paid fails
        while (
          !(paid instanceof ZeroAmountForUsdRecipientError) &&
          minBtcAmountToSpend.amount > 1n
        ) {
          minBtcAmountToSpend = calc.sub(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
        // Increment to discover min BTC amount to sell for $0.01
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            recipientWalletId: newUsdWallet.id,
            memo: null,
            amount: toSats(minBtcAmountToSpend.amount),
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
      const lnInvoice = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      // Step 2: Pay invoice from USD wallet at favourable rate
      const result = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (result instanceof Error) throw result

      // Step 3: Replenish USD from BTC wallet with discovered 'minBtcAmountToSpend' for $0.01
      const lnInvoiceNoAmountUsd = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoiceNoAmountUsd instanceof Error) throw lnInvoiceNoAmountUsd

      const repaid = await Payments.payNoAmountInvoiceByWalletId({
        amount: toSats(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoiceNoAmountUsd.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 4: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay max invoice to btc wallet from usd wallet, replenish $0.01 with usd-denominated fee probe", async () => {
      // send-lightning => sender usd wallet => usdFromBtc => expects Sell

      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
      const lnInvoice = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      // Step 2: Pay invoice from USD wallet at favourable rate
      const result = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (result instanceof Error) throw result

      // Step 3: Replenish USD from BTC wallet with $0.01 invoice
      const lnInvoiceUsd = await Wallets.addInvoiceForSelf({
        walletId: newUsdWallet.id,
        amount: toCents(1),
      })
      if (lnInvoiceUsd instanceof Error) throw lnInvoiceUsd

      const probe = await Payments.getLightningFeeEstimation({
        uncheckedPaymentRequest: lnInvoiceUsd.paymentRequest,
        walletId: newBtcWallet.id,
      })
      if (probe instanceof Error) throw probe

      const resultUsd = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoiceUsd.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (resultUsd instanceof Error) throw resultUsd

      // Step 4: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay max invoice to btc wallet from usd wallet, replenish $0.01 with no-amount min btc fee probe", async () => {
      // send-lightning => sender usd wallet => usdFromBtc => expects Sell

      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend = startingBtcAmount
      {
        const sendArgs = {
          recipientWalletId: newUsdWallet.id,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        }
        let paid = await Payments.intraledgerPaymentSendWalletId({
          amount: toSats(minBtcAmountToSpend.amount),
          ...sendArgs,
        })
        // Ensure paid is 'Success' for starting amount
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
        // Decrement until paid fails
        while (
          !(paid instanceof ZeroAmountForUsdRecipientError) &&
          minBtcAmountToSpend.amount > 1n
        ) {
          minBtcAmountToSpend = calc.sub(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
        // Increment to discover min BTC amount to sell for $0.01
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            recipientWalletId: newUsdWallet.id,
            memo: null,
            amount: toSats(minBtcAmountToSpend.amount),
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
      const lnInvoice = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      // Step 2: Pay invoice from USD wallet at favourable rate
      const result = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (result instanceof Error) throw result

      // Step 3: Replenish USD from BTC wallet with discovered 'minBtcAmountToSpend' for $0.01
      const lnInvoiceNoAmountUsd = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoiceNoAmountUsd instanceof Error) throw lnInvoiceNoAmountUsd

      const probe = await Payments.getNoAmountLightningFeeEstimation({
        amount: toSats(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoiceNoAmountUsd.paymentRequest,
        walletId: newBtcWallet.id,
      })
      if (probe instanceof Error) throw probe

      const repaid = await Payments.payNoAmountInvoiceByWalletId({
        amount: toSats(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoiceNoAmountUsd.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 4: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay max fee probe to btc wallet from usd wallet, replenish $0.01 with usd-denominated invoice", async () => {
      // send-lightning => sender usd wallet => usdFromBtc => expects Sell

      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
      const lnInvoice = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      // Step 2: Pay invoice from USD wallet at favourable rate
      const probe = await Payments.getLightningFeeEstimation({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        walletId: newUsdWallet.id,
      })
      if (probe instanceof Error) throw probe

      const result = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (result instanceof Error) throw result

      // Step 3: Replenish USD from BTC wallet with $0.01 invoice
      const lnInvoiceUsd = await Wallets.addInvoiceForSelf({
        walletId: newUsdWallet.id,
        amount: toCents(1),
      })
      if (lnInvoiceUsd instanceof Error) throw lnInvoiceUsd

      const resultUsd = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoiceUsd.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (resultUsd instanceof Error) throw resultUsd

      // Step 4: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay max fee probe to btc wallet from usd wallet, replenish $0.01 with no-amount min btc invoice", async () => {
      // send-lightning => sender usd wallet => usdFromBtc => expects Sell

      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend = startingBtcAmount
      {
        const sendArgs = {
          recipientWalletId: newUsdWallet.id,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        }
        let paid = await Payments.intraledgerPaymentSendWalletId({
          amount: toSats(minBtcAmountToSpend.amount),
          ...sendArgs,
        })
        // Ensure paid is 'Success' for starting amount
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
        // Decrement until paid fails
        while (
          !(paid instanceof ZeroAmountForUsdRecipientError) &&
          minBtcAmountToSpend.amount > 1n
        ) {
          minBtcAmountToSpend = calc.sub(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
        // Increment to discover min BTC amount to sell for $0.01
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            recipientWalletId: newUsdWallet.id,
            memo: null,
            amount: toSats(minBtcAmountToSpend.amount),
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
      const lnInvoice = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      // Step 2: Pay invoice from USD wallet at favourable rate
      const probe = await Payments.getLightningFeeEstimation({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        walletId: newUsdWallet.id,
      })
      if (probe instanceof Error) throw probe

      const result = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (result instanceof Error) throw result

      // Step 3: Replenish USD from BTC wallet with discovered 'minBtcAmountToSpend' for $0.01
      const lnInvoiceNoAmountUsd = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoiceNoAmountUsd instanceof Error) throw lnInvoiceNoAmountUsd

      const repaid = await Payments.payNoAmountInvoiceByWalletId({
        amount: toSats(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoiceNoAmountUsd.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 4: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay max fee probe to btc wallet from usd wallet, replenish $0.01 with usd-denominated fee probe", async () => {
      // send-lightning => sender usd wallet => usdFromBtc => expects Sell

      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
      const lnInvoice = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      // Step 2: Pay invoice from USD wallet at favourable rate
      const probe = await Payments.getLightningFeeEstimation({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        walletId: newUsdWallet.id,
      })
      if (probe instanceof Error) throw probe

      const result = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (result instanceof Error) throw result

      // Step 3: Replenish USD from BTC wallet with $0.01 invoice
      const lnInvoiceUsd = await Wallets.addInvoiceForSelf({
        walletId: newUsdWallet.id,
        amount: toCents(1),
      })
      if (lnInvoiceUsd instanceof Error) throw lnInvoiceUsd

      const probeUsd = await Payments.getLightningFeeEstimation({
        uncheckedPaymentRequest: lnInvoiceUsd.paymentRequest,
        walletId: newBtcWallet.id,
      })
      if (probeUsd instanceof Error) throw probeUsd

      const resultUsd = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoiceUsd.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (resultUsd instanceof Error) throw resultUsd

      // Step 4: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay max fee probe to btc wallet from usd wallet, replenish $0.01 with no-amount min btc fee probe", async () => {
      // send-lightning => sender usd wallet => usdFromBtc => expects Sell

      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend = startingBtcAmount
      {
        const sendArgs = {
          recipientWalletId: newUsdWallet.id,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        }
        let paid = await Payments.intraledgerPaymentSendWalletId({
          amount: toSats(minBtcAmountToSpend.amount),
          ...sendArgs,
        })
        // Ensure paid is 'Success' for starting amount
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
        // Decrement until paid fails
        while (
          !(paid instanceof ZeroAmountForUsdRecipientError) &&
          minBtcAmountToSpend.amount > 1n
        ) {
          minBtcAmountToSpend = calc.sub(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
        // Increment to discover min BTC amount to sell for $0.01
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            recipientWalletId: newUsdWallet.id,
            memo: null,
            amount: toSats(minBtcAmountToSpend.amount),
            senderWalletId: newBtcWallet.id,
            senderAccount: newAccount,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Create invoice from BTC Wallet using discovered 'maxBtcAmountToEarn' from $0.01
      const lnInvoice = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      // Step 2: Pay invoice from USD wallet at favourable rate
      const probe = await Payments.getLightningFeeEstimation({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        walletId: newUsdWallet.id,
      })
      if (probe instanceof Error) throw probe

      const result = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (result instanceof Error) throw result

      // Step 3: Replenish USD from BTC wallet with discovered 'minBtcAmountToSpend' for $0.01
      const lnInvoiceNoAmountUsd = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoiceNoAmountUsd instanceof Error) throw lnInvoiceNoAmountUsd

      const probeUsd = await Payments.getNoAmountLightningFeeEstimation({
        amount: toSats(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoiceNoAmountUsd.paymentRequest,
        walletId: newBtcWallet.id,
      })
      if (probeUsd instanceof Error) throw probeUsd

      const repaid = await Payments.payNoAmountInvoiceByWalletId({
        amount: toSats(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoiceNoAmountUsd.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 4: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })
  })

  describe("can pay 1 sat and receive $0.01", () => {
    it("pay 1 sat to usd wallet intraledger, convert back with intraledger payment", async () => {
      // send-intraledger => sender btc wallet => usdFromBtc => expects Buy

      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      const sendArgs = {
        recipientWalletId: newUsdWallet.id,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      }

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend: BtcPaymentAmount = ONE_SAT
      {
        let paid = await Payments.intraledgerPaymentSendWalletId({
          amount: toSats(minBtcAmountToSpend.amount),
          ...sendArgs,
        })
        // Increment to discover min BTC amount to sell for $0.01
        while (paid instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          paid = await Payments.intraledgerPaymentSendWalletId({
            amount: toSats(minBtcAmountToSpend.amount),
            ...sendArgs,
          })
          if (
            paid instanceof Error &&
            !(paid instanceof ZeroAmountForUsdRecipientError)
          ) {
            throw paid
          }
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Pay min sats intraledger to USD wallet
      const paid = await Payments.intraledgerPaymentSendWalletId({
        amount: toSats(minBtcAmountToSpend.amount),
        ...sendArgs,
      })
      if (paid instanceof Error) throw paid

      // Step 2: Pay back $0.01 from USD to BTC wallet
      const repaid = await Payments.intraledgerPaymentSendWalletId({
        amount: toCents(1),
        recipientWalletId: newBtcWallet.id,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 3: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay 1 sat to usd wallet via no-amount invoice, convert back with intraledger payment", async () => {
      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getBtcForUsdEquivalent = async (
        btcPaymentAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
        const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
          walletId: newUsdWallet.id,
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeBtc = await getBalanceHelper(newBtcWallet.id)
        const result = await Payments.payNoAmountInvoiceByWalletId({
          amount: Number(btcPaymentAmount.amount),
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) {
          if (!(result instanceof ZeroAmountForUsdRecipientError)) throw result
          return result
        }
        const afterBtc = await getBalanceHelper(newBtcWallet.id)
        const diff = (beforeBtc - afterBtc) as CurrencyBaseAmount
        return diff
      }

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend: BtcPaymentAmount = ONE_SAT
      {
        let diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        // Increment to discover min BTC amount to sell for $0.01
        while (diff instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Pay min sats via no-amount invoice to USD wallet
      const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      const paid = await Payments.payNoAmountInvoiceByWalletId({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (paid instanceof Error) throw paid

      // Step 2: Pay back $0.01 from USD to BTC wallet
      const repaid = await Payments.intraledgerPaymentSendWalletId({
        amount: toCents(1),
        recipientWalletId: newBtcWallet.id,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 3: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay 1 sat to usd wallet via no-amount fee probe, convert back with intraledger payment", async () => {
      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getBtcForUsdEquivalent = async (
        btcPaymentAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
        const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
          walletId: newUsdWallet.id,
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeBtc = await getBalanceHelper(newBtcWallet.id)
        const result = await Payments.payNoAmountInvoiceByWalletId({
          amount: Number(btcPaymentAmount.amount),
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) {
          if (!(result instanceof ZeroAmountForUsdRecipientError)) throw result
          return result
        }
        const afterBtc = await getBalanceHelper(newBtcWallet.id)
        const diff = (beforeBtc - afterBtc) as CurrencyBaseAmount
        return diff
      }

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend: BtcPaymentAmount = ONE_SAT
      {
        let diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        // Increment to discover min BTC amount to sell for $0.01
        while (diff instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Pay min sats via no-amount invoice to USD wallet
      const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      const probe = await Payments.getNoAmountLightningFeeEstimation({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        walletId: newBtcWallet.id,
      })
      if (probe instanceof Error) throw probe

      const paid = await Payments.payNoAmountInvoiceByWalletId({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (paid instanceof Error) throw paid

      // Step 2: Pay back $0.01 from USD to BTC wallet
      const repaid = await Payments.intraledgerPaymentSendWalletId({
        amount: toCents(1),
        recipientWalletId: newBtcWallet.id,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 3: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay 1 sat to usd wallet via no-amount invoice, convert back with no-amount invoice", async () => {
      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getBtcForUsdEquivalent = async (
        btcPaymentAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
        const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
          walletId: newUsdWallet.id,
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeBtc = await getBalanceHelper(newBtcWallet.id)
        const result = await Payments.payNoAmountInvoiceByWalletId({
          amount: Number(btcPaymentAmount.amount),
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) {
          if (!(result instanceof ZeroAmountForUsdRecipientError)) throw result
          return result
        }
        const afterBtc = await getBalanceHelper(newBtcWallet.id)
        const diff = (beforeBtc - afterBtc) as CurrencyBaseAmount
        return diff
      }

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend: BtcPaymentAmount = ONE_SAT
      {
        let diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        // Increment to discover min BTC amount to sell for $0.01
        while (diff instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Pay min sats via no-amount invoice to USD wallet
      const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      const paid = await Payments.payNoAmountInvoiceByWalletId({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (paid instanceof Error) throw paid

      // Step 2: Replenish BTC from USD wallet with $0.01
      const lnInvoiceNoAmountBtc = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newBtcWallet.id,
      })
      if (lnInvoiceNoAmountBtc instanceof Error) throw lnInvoiceNoAmountBtc

      const repaid = await Payments.payNoAmountInvoiceByWalletId({
        amount: toCents(1),
        uncheckedPaymentRequest: lnInvoiceNoAmountBtc.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 3: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay 1 sat to usd wallet via no-amount invoice, convert back with no-amount fee probe", async () => {
      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getBtcForUsdEquivalent = async (
        btcPaymentAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
        const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
          walletId: newUsdWallet.id,
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeBtc = await getBalanceHelper(newBtcWallet.id)
        const result = await Payments.payNoAmountInvoiceByWalletId({
          amount: Number(btcPaymentAmount.amount),
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) {
          if (!(result instanceof ZeroAmountForUsdRecipientError)) throw result
          return result
        }
        const afterBtc = await getBalanceHelper(newBtcWallet.id)
        const diff = (beforeBtc - afterBtc) as CurrencyBaseAmount
        return diff
      }

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend: BtcPaymentAmount = ONE_SAT
      {
        let diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        // Increment to discover min BTC amount to sell for $0.01
        while (diff instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Pay min sats via no-amount invoice to USD wallet
      const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      const paid = await Payments.payNoAmountInvoiceByWalletId({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (paid instanceof Error) throw paid

      // Step 2: Replenish BTC from USD wallet with $0.01
      const lnInvoiceNoAmountBtc = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newBtcWallet.id,
      })
      if (lnInvoiceNoAmountBtc instanceof Error) throw lnInvoiceNoAmountBtc

      const probeBtc = await Payments.getNoAmountLightningFeeEstimation({
        amount: toCents(1),
        uncheckedPaymentRequest: lnInvoiceNoAmountBtc.paymentRequest,
        walletId: newUsdWallet.id,
      })
      if (probeBtc instanceof Error) throw probeBtc

      const repaid = await Payments.payNoAmountInvoiceByWalletId({
        amount: toCents(1),
        uncheckedPaymentRequest: lnInvoiceNoAmountBtc.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 3: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay 1 sat to usd wallet via no-amount invoice, convert back with max amount invoice", async () => {
      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getBtcForUsdEquivalent = async (
        btcPaymentAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
        const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
          walletId: newUsdWallet.id,
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeBtc = await getBalanceHelper(newBtcWallet.id)
        const result = await Payments.payNoAmountInvoiceByWalletId({
          amount: Number(btcPaymentAmount.amount),
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) {
          if (!(result instanceof ZeroAmountForUsdRecipientError)) throw result
          return result
        }
        const afterBtc = await getBalanceHelper(newBtcWallet.id)
        const diff = (beforeBtc - afterBtc) as CurrencyBaseAmount
        return diff
      }

      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend: BtcPaymentAmount = ONE_SAT
      {
        let diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        // Increment to discover min BTC amount to sell for $0.01
        while (diff instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Pay min sats via no-amount invoice to USD wallet
      const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      const paid = await Payments.payNoAmountInvoiceByWalletId({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (paid instanceof Error) throw paid

      // Step 2: Pay back $0.01 from USD to BTC wallet
      const lnInvoiceBtc = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoiceBtc instanceof Error) throw lnInvoiceBtc

      const repaid = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoiceBtc.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 3: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay 1 sat to usd wallet via no-amount invoice, convert back with max amount fee probe", async () => {
      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getBtcForUsdEquivalent = async (
        btcPaymentAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
        const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
          walletId: newUsdWallet.id,
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeBtc = await getBalanceHelper(newBtcWallet.id)
        const result = await Payments.payNoAmountInvoiceByWalletId({
          amount: Number(btcPaymentAmount.amount),
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) {
          if (!(result instanceof ZeroAmountForUsdRecipientError)) throw result
          return result
        }
        const afterBtc = await getBalanceHelper(newBtcWallet.id)
        const diff = (beforeBtc - afterBtc) as CurrencyBaseAmount
        return diff
      }

      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend: BtcPaymentAmount = ONE_SAT
      {
        let diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        // Increment to discover min BTC amount to sell for $0.01
        while (diff instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Pay min sats via no-amount invoice to USD wallet
      const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      const paid = await Payments.payNoAmountInvoiceByWalletId({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (paid instanceof Error) throw paid

      // Step 2: Pay back $0.01 from USD to BTC wallet
      const lnInvoiceBtc = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoiceBtc instanceof Error) throw lnInvoiceBtc

      const probeUsd = await Payments.getLightningFeeEstimation({
        uncheckedPaymentRequest: lnInvoiceBtc.paymentRequest,
        walletId: newUsdWallet.id,
      })
      if (probeUsd instanceof Error) throw probeUsd

      const repaid = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoiceBtc.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 3: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay 1 sat to usd wallet via no-amount fee probe, convert back with no-amount invoice", async () => {
      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getBtcForUsdEquivalent = async (
        btcPaymentAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
        const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
          walletId: newUsdWallet.id,
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeBtc = await getBalanceHelper(newBtcWallet.id)
        const result = await Payments.payNoAmountInvoiceByWalletId({
          amount: Number(btcPaymentAmount.amount),
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) {
          if (!(result instanceof ZeroAmountForUsdRecipientError)) throw result
          return result
        }
        const afterBtc = await getBalanceHelper(newBtcWallet.id)
        const diff = (beforeBtc - afterBtc) as CurrencyBaseAmount
        return diff
      }

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend: BtcPaymentAmount = ONE_SAT
      {
        let diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        // Increment to discover min BTC amount to sell for $0.01
        while (diff instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Pay min sats via no-amount invoice to USD wallet
      const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      const probe = await Payments.getNoAmountLightningFeeEstimation({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        walletId: newBtcWallet.id,
      })
      if (probe instanceof Error) throw probe

      const paid = await Payments.payNoAmountInvoiceByWalletId({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (paid instanceof Error) throw paid

      // Step 2: Replenish BTC from USD wallet with $0.01
      const lnInvoiceNoAmountBtc = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newBtcWallet.id,
      })
      if (lnInvoiceNoAmountBtc instanceof Error) throw lnInvoiceNoAmountBtc

      const repaid = await Payments.payNoAmountInvoiceByWalletId({
        amount: toCents(1),
        uncheckedPaymentRequest: lnInvoiceNoAmountBtc.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 3: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay 1 sat to usd wallet via no-amount fee probe, convert back with no-amount fee probe", async () => {
      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getBtcForUsdEquivalent = async (
        btcPaymentAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
        const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
          walletId: newUsdWallet.id,
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeBtc = await getBalanceHelper(newBtcWallet.id)
        const result = await Payments.payNoAmountInvoiceByWalletId({
          amount: Number(btcPaymentAmount.amount),
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) {
          if (!(result instanceof ZeroAmountForUsdRecipientError)) throw result
          return result
        }
        const afterBtc = await getBalanceHelper(newBtcWallet.id)
        const diff = (beforeBtc - afterBtc) as CurrencyBaseAmount
        return diff
      }

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend: BtcPaymentAmount = ONE_SAT
      {
        let diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        // Increment to discover min BTC amount to sell for $0.01
        while (diff instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Pay min sats via no-amount invoice to USD wallet
      const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      const probe = await Payments.getNoAmountLightningFeeEstimation({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        walletId: newBtcWallet.id,
      })
      if (probe instanceof Error) throw probe

      const paid = await Payments.payNoAmountInvoiceByWalletId({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (paid instanceof Error) throw paid

      // Step 2: Replenish BTC from USD wallet with $0.01
      const lnInvoiceNoAmountBtc = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newBtcWallet.id,
      })
      if (lnInvoiceNoAmountBtc instanceof Error) throw lnInvoiceNoAmountBtc

      const probeBtc = await Payments.getNoAmountLightningFeeEstimation({
        amount: toCents(1),
        uncheckedPaymentRequest: lnInvoiceNoAmountBtc.paymentRequest,
        walletId: newUsdWallet.id,
      })
      if (probeBtc instanceof Error) throw probeBtc

      const repaid = await Payments.payNoAmountInvoiceByWalletId({
        amount: toCents(1),
        uncheckedPaymentRequest: lnInvoiceNoAmountBtc.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 3: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay 1 sat to usd wallet via no-amount fee probe, convert back with max amount invoice", async () => {
      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getBtcForUsdEquivalent = async (
        btcPaymentAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
        const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
          walletId: newUsdWallet.id,
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeBtc = await getBalanceHelper(newBtcWallet.id)
        const result = await Payments.payNoAmountInvoiceByWalletId({
          amount: Number(btcPaymentAmount.amount),
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) {
          if (!(result instanceof ZeroAmountForUsdRecipientError)) throw result
          return result
        }
        const afterBtc = await getBalanceHelper(newBtcWallet.id)
        const diff = (beforeBtc - afterBtc) as CurrencyBaseAmount
        return diff
      }

      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend: BtcPaymentAmount = ONE_SAT
      {
        let diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        // Increment to discover min BTC amount to sell for $0.01
        while (diff instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Pay min sats via no-amount invoice to USD wallet
      const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      const probe = await Payments.getNoAmountLightningFeeEstimation({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        walletId: newBtcWallet.id,
      })
      if (probe instanceof Error) throw probe

      const paid = await Payments.payNoAmountInvoiceByWalletId({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (paid instanceof Error) throw paid

      // Step 2: Pay back $0.01 from USD to BTC wallet
      const lnInvoiceBtc = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoiceBtc instanceof Error) throw lnInvoiceBtc

      const repaid = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoiceBtc.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 3: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })

    it("pay 1 sat to usd wallet via no-amount fee probe, convert back with max amount fee probe", async () => {
      const USD_STARTING_BALANCE = 10 as UsdCents
      const usdFundingAmount = paymentAmountFromNumber({
        amount: USD_STARTING_BALANCE,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // CREATE NEW ACCOUNT WALLETS
      // =====
      const phone = randomPhone()
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      const newAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (newAccount instanceof Error) throw newAccount

      // DISCOVER ARBITRAGE AMOUNTS FOR STRATEGY
      // =====
      const getBtcForUsdEquivalent = async (
        btcPaymentAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount | ZeroAmountForUsdRecipientError> => {
        const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
          walletId: newUsdWallet.id,
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeBtc = await getBalanceHelper(newBtcWallet.id)
        const result = await Payments.payNoAmountInvoiceByWalletId({
          amount: Number(btcPaymentAmount.amount),
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newBtcWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) {
          if (!(result instanceof ZeroAmountForUsdRecipientError)) throw result
          return result
        }
        const afterBtc = await getBalanceHelper(newBtcWallet.id)
        const diff = (beforeBtc - afterBtc) as CurrencyBaseAmount
        return diff
      }

      const getUsdForBtcEquivalent = async (
        btcAmount: BtcPaymentAmount,
      ): Promise<CurrencyBaseAmount> => {
        const lnInvoice = await Wallets.addInvoiceForSelf({
          walletId: newBtcWallet.id,
          amount: toSats(btcAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice

        const beforeUsd = await getBalanceHelper(newUsdWallet.id)
        const result = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: lnInvoice.paymentRequest,
          memo: null,
          senderWalletId: newUsdWallet.id,
          senderAccount: newAccount,
        })
        if (result instanceof Error) throw result
        const afterUsd = await getBalanceHelper(newUsdWallet.id)
        const diff = (beforeUsd - afterUsd) as CurrencyBaseAmount
        return diff
      }

      const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
      if (midPriceRatio instanceof Error) throw midPriceRatio
      const startingBtcAmount = midPriceRatio.convertFromUsd(ONE_CENT)

      // Validate btc starting amount for min btc discovery
      let minBtcAmountToSpend: BtcPaymentAmount = ONE_SAT
      {
        let diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        // Increment to discover min BTC amount to sell for $0.01
        while (diff instanceof ZeroAmountForUsdRecipientError) {
          minBtcAmountToSpend = calc.add(minBtcAmountToSpend, ONE_SAT)
          diff = await getBtcForUsdEquivalent(minBtcAmountToSpend)
        }
      }
      baseLogger.info("Discovered:", { minBtcAmountToSpend })

      // Validate btc starting amount for max btc discovery
      let maxBtcAmountToEarn = startingBtcAmount
      {
        // 3 steps here to:
        // - check diff is greater than 1 to start (push up if not)
        // - bring the diff down, in case starting diff is already past max
        // - push up to find max, from place where we are sure diff is 1

        // Ensure diff is '> 1' for starting amount
        let diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        while (diff <= 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        // Decrement until diff is 1
        while (diff > 1) {
          maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        expect(diff).toEqual(1)
        // Increment to discover max BTC amount to buy for $0.01
        while (diff === 1) {
          maxBtcAmountToEarn = calc.add(maxBtcAmountToEarn, ONE_SAT)
          diff = await getUsdForBtcEquivalent(maxBtcAmountToEarn)
        }
        maxBtcAmountToEarn = calc.sub(maxBtcAmountToEarn, ONE_SAT)
      }
      baseLogger.info("Discovered:", { maxBtcAmountToEarn })

      // EXECUTE ARBITRAGE
      // =====
      const btcBalanceBefore = await getBalanceHelper(newBtcWallet.id)
      const usdBalanceBefore = await getBalanceHelper(newUsdWallet.id)

      // Step 1: Pay min sats via no-amount invoice to USD wallet
      const lnInvoice = await Wallets.addInvoiceNoAmountForSelf({
        walletId: newUsdWallet.id,
      })
      if (lnInvoice instanceof Error) throw lnInvoice

      const probe = await Payments.getNoAmountLightningFeeEstimation({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        walletId: newBtcWallet.id,
      })
      if (probe instanceof Error) throw probe

      const paid = await Payments.payNoAmountInvoiceByWalletId({
        amount: Number(minBtcAmountToSpend.amount),
        uncheckedPaymentRequest: lnInvoice.paymentRequest,
        memo: null,
        senderWalletId: newBtcWallet.id,
        senderAccount: newAccount,
      })
      if (paid instanceof Error) throw paid

      // Step 2: Pay back $0.01 from USD to BTC wallet
      const lnInvoiceBtc = await Wallets.addInvoiceForSelf({
        walletId: newBtcWallet.id,
        amount: toSats(maxBtcAmountToEarn.amount),
      })
      if (lnInvoiceBtc instanceof Error) throw lnInvoiceBtc

      const probeUsd = await Payments.getLightningFeeEstimation({
        uncheckedPaymentRequest: lnInvoiceBtc.paymentRequest,
        walletId: newUsdWallet.id,
      })
      if (probeUsd instanceof Error) throw probeUsd

      const repaid = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: lnInvoiceBtc.paymentRequest,
        memo: null,
        senderWalletId: newUsdWallet.id,
        senderAccount: newAccount,
      })
      if (repaid instanceof Error) throw repaid

      // Step 3: Check that no profit was made in the process
      const btcBalanceAfter = await getBalanceHelper(newBtcWallet.id)
      const diffBtc = btcBalanceAfter - btcBalanceBefore
      expect(diffBtc).toBeLessThanOrEqual(0)

      const usdBalanceAfter = await getBalanceHelper(newUsdWallet.id)
      const diffUsd = usdBalanceAfter - usdBalanceBefore
      expect(diffUsd).toBeLessThanOrEqual(0)
    })
  })
})
