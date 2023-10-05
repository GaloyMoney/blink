import { Payments, Wallets } from "@/app"
import { getMidPriceRatio } from "@/app/prices"

import { getDealerConfig } from "@/config"

import { PaymentSendStatus } from "@/domain/bitcoin/lightning"
import { LimitsExceededError } from "@/domain/errors"
import { paymentAmountFromNumber, WalletCurrency } from "@/domain/shared"

import { AccountsRepository } from "@/services/mongoose"

import {
  addNewWallet,
  checkIsBalanced,
  createInvoice,
  randomAccount,
  lndOutside1,
  createRandomUserAndWallets,
  fundWallet,
  createRandomUserAndBtcWallet,
} from "test/helpers"

const MOCKED_LIMIT = 100 as UsdCents
const AMOUNT_ABOVE_THRESHOLD = 10 as UsdCents
const MOCKED_BALANCE_ABOVE_THRESHOLD = (MOCKED_LIMIT + 20) as UsdCents
const accountLimits: IAccountLimits = {
  intraLedgerLimit: MOCKED_LIMIT,
  withdrawalLimit: MOCKED_LIMIT,
  tradeIntraAccountLimit: MOCKED_LIMIT,
}

jest.mock("@/config", () => {
  const config = jest.requireActual("@/config")
  return {
    ...config,
    getDealerConfig: jest.fn().mockReturnValue({
      usd: { hedgingEnabled: true },
    }),
    getAccountLimits: jest.fn().mockReturnValue({
      intraLedgerLimit: 100 as UsdCents,
      withdrawalLimit: 100 as UsdCents,
      tradeIntraAccountLimit: 100 as UsdCents,
    }),
    getInvoiceCreateAttemptLimits: jest.fn().mockReturnValue({
      ...config.getInvoiceCreateAttemptLimits(),
      points: 100,
    }),
  }
})

const centsToUsdString = (cents: UsdCents) => `$${(cents / 100).toFixed(2)}`

const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled

let otherAccountId: AccountId
let otherBtcWallet: Wallet
let otherUsdWallet: Wallet // eslint-disable-line @typescript-eslint/no-unused-vars

beforeAll(async () => {
  otherAccountId = (await randomAccount()).id

  const btcWallet = await addNewWallet({
    accountId: otherAccountId,
    currency: WalletCurrency.Btc,
  })
  if (btcWallet instanceof Error) throw btcWallet
  otherBtcWallet = btcWallet

  const usdWallet = await addNewWallet({
    accountId: otherAccountId,
    currency: WalletCurrency.Usd,
  })
  if (usdWallet instanceof Error) throw usdWallet
  otherUsdWallet = usdWallet
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(() => {
  jest.restoreAllMocks()
})

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

describe("UserWallet Limits - Lightning Pay", () => {
  describe("single payment above limit fails limit check", () => {
    it("fails to pay when withdrawalLimit exceeded", async () => {
      // Create new wallet
      const btcWalletDescriptor = await createRandomUserAndBtcWallet()
      await fundWallet({
        walletId: btcWalletDescriptor.id,
        balanceAmount: await btcAmountFromUsdNumber(MOCKED_BALANCE_ABOVE_THRESHOLD),
      })

      // Test limits
      const usdAmountAboveThreshold =
        accountLimits.withdrawalLimit + AMOUNT_ABOVE_THRESHOLD
      const btcThresholdAmount = await btcAmountFromUsdNumber(usdAmountAboveThreshold)

      const senderAccount = await AccountsRepository().findById(
        btcWalletDescriptor.accountId,
      )
      if (senderAccount instanceof Error) throw senderAccount

      const { request } = await createInvoice({
        lnd: lndOutside1,
        tokens: Number(btcThresholdAmount.amount),
      })

      const paymentResult = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: request,
        memo: null,
        senderWalletId: btcWalletDescriptor.id,
        senderAccount,
      })

      expect(paymentResult).toBeInstanceOf(LimitsExceededError)
      const expectedError = `Cannot transfer more than ${centsToUsdString(
        accountLimits.withdrawalLimit,
      )} in 24 hours`
      expect((paymentResult as Error).message).toBe(expectedError)
    })

    it("fails to pay when amount exceeds intraLedger limit", async () => {
      // Create new wallet
      const btcWalletDescriptor = await createRandomUserAndBtcWallet()
      await fundWallet({
        walletId: btcWalletDescriptor.id,
        balanceAmount: await btcAmountFromUsdNumber(MOCKED_BALANCE_ABOVE_THRESHOLD),
      })

      // Test limits
      const usdAmountAboveThreshold =
        accountLimits.intraLedgerLimit + AMOUNT_ABOVE_THRESHOLD
      const btcThresholdAmount = await btcAmountFromUsdNumber(usdAmountAboveThreshold)

      const senderAccount = await AccountsRepository().findById(
        btcWalletDescriptor.accountId,
      )
      if (senderAccount instanceof Error) throw senderAccount

      const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
        walletId: otherBtcWallet.id,
        amount: Number(btcThresholdAmount.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice
      const { paymentRequest: request } = lnInvoice

      const paymentResult = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: request,
        memo: null,
        senderWalletId: btcWalletDescriptor.id,
        senderAccount,
      })

      expect(paymentResult).toBeInstanceOf(LimitsExceededError)
      const expectedError = `Cannot transfer more than ${centsToUsdString(
        accountLimits.intraLedgerLimit,
      )} in 24 hours`
      expect((paymentResult as Error).message).toBe(expectedError)
    })

    it("fails to pay when amount exceeds tradeIntraAccount limit", async () => {
      const usdFundingAmount = paymentAmountFromNumber({
        amount: MOCKED_BALANCE_ABOVE_THRESHOLD,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // Create new wallets
      const { btcWalletDescriptor, usdWalletDescriptor } =
        await createRandomUserAndWallets()
      await fundWallet({
        walletId: btcWalletDescriptor.id,
        balanceAmount: await btcAmountFromUsdNumber(MOCKED_BALANCE_ABOVE_THRESHOLD),
      })
      await fundWallet({
        walletId: usdWalletDescriptor.id,
        balanceAmount: usdFundingAmount,
      })

      const senderAccount = await AccountsRepository().findById(
        btcWalletDescriptor.accountId,
      )
      if (senderAccount instanceof Error) throw senderAccount

      const usdAmountAboveThreshold =
        accountLimits.tradeIntraAccountLimit + AMOUNT_ABOVE_THRESHOLD
      const btcThresholdAmount = await btcAmountFromUsdNumber(usdAmountAboveThreshold)
      const usdPaymentAmount = paymentAmountFromNumber({
        amount: usdAmountAboveThreshold,
        currency: WalletCurrency.Usd,
      })
      if (usdPaymentAmount instanceof Error) throw usdPaymentAmount

      // Test BTC -> USD limits
      {
        const lnInvoice = await Wallets.addInvoiceForSelfForUsdWallet({
          walletId: usdWalletDescriptor.id,
          amount: Number(usdPaymentAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice
        const { paymentRequest: uncheckedPaymentRequest } = lnInvoice

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).toBeInstanceOf(LimitsExceededError)
        const expectedError = `Cannot transfer more than ${centsToUsdString(
          accountLimits.tradeIntraAccountLimit,
        )} in 24 hours`
        expect((paymentResult as Error).message).toBe(expectedError)
      }

      // Test USD -> BTC limits
      {
        const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
          walletId: btcWalletDescriptor.id,
          amount: Number(btcThresholdAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice
        const { paymentRequest: uncheckedPaymentRequestBtc } = lnInvoice

        const paymentResultUsd = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: uncheckedPaymentRequestBtc,
          memo: null,
          senderWalletId: usdWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResultUsd).toBeInstanceOf(LimitsExceededError)
        const expectedErrorUsd = `Cannot transfer more than ${centsToUsdString(
          accountLimits.tradeIntraAccountLimit,
        )} in 24 hours`
        expect((paymentResultUsd as Error).message).toBe(expectedErrorUsd)
      }
    })
  })

  describe("multiple payments up to limit succeed, last payment fails", () => {
    const getPartialAmountsForMultiplePaymentsBelowLimit = async ({
      limit,
      numPayments,
    }: {
      limit: keyof IAccountLimits
      numPayments: number
    }) => {
      const bufferForSpread = 2
      const partialUsdAmount =
        Math.floor(accountLimits[limit] / numPayments) - bufferForSpread

      const partialUsdSendAmount = paymentAmountFromNumber({
        amount: partialUsdAmount,
        currency: WalletCurrency.Usd,
      })
      if (partialUsdSendAmount instanceof Error) throw partialUsdAmount

      const partialBtcSendAmount = await btcAmountFromUsdNumber(partialUsdAmount)

      return {
        partialUsdSendAmount,
        partialBtcSendAmount,
      }
    }

    it("fails to pay when intraLedgerLimit exceeded", async () => {
      // Create and fund new wallets
      const btcFundingAmount = await btcAmountFromUsdNumber(
        MOCKED_BALANCE_ABOVE_THRESHOLD,
      )
      const usdFundingAmount = paymentAmountFromNumber({
        amount: MOCKED_BALANCE_ABOVE_THRESHOLD,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      const { btcWalletDescriptor, usdWalletDescriptor } =
        await createRandomUserAndWallets()
      await fundWallet({
        walletId: btcWalletDescriptor.id,
        balanceAmount: btcFundingAmount,
      })
      await fundWallet({
        walletId: usdWalletDescriptor.id,
        balanceAmount: usdFundingAmount,
      })

      const senderAccount = await AccountsRepository().findById(
        btcWalletDescriptor.accountId,
      )
      if (senderAccount instanceof Error) throw senderAccount

      // Succeeds for multiple payments below limit
      const numPayments = 2
      const { partialBtcSendAmount } =
        await getPartialAmountsForMultiplePaymentsBelowLimit({
          limit: "intraLedgerLimit",
          numPayments,
        })
      for (let i = 0; i < numPayments; i++) {
        const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
          walletId: otherBtcWallet.id,
          amount: Number(partialBtcSendAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice
        const { paymentRequest: request } = lnInvoice

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: request,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).not.toBeInstanceOf(Error)
        expect(paymentResult).toBe(PaymentSendStatus.Success)
      }

      const btcAmountAboveThreshold = await btcAmountFromUsdNumber(AMOUNT_ABOVE_THRESHOLD)
      const usdAmountAboveThreshold = paymentAmountFromNumber({
        amount: AMOUNT_ABOVE_THRESHOLD,
        currency: WalletCurrency.Usd,
      })
      if (usdAmountAboveThreshold instanceof Error) throw usdAmountAboveThreshold

      {
        // Fails for payment just above limit
        const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
          walletId: otherBtcWallet.id,
          amount: Number(btcAmountAboveThreshold.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice
        const { paymentRequest: request } = lnInvoice

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: request,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).toBeInstanceOf(LimitsExceededError)
        const expectedError = `Cannot transfer more than ${centsToUsdString(
          accountLimits.intraLedgerLimit,
        )} in 24 hours`
        expect((paymentResult as Error).message).toBe(expectedError)

        const paymentResultUsd = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: request,
          memo: null,
          senderWalletId: usdWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResultUsd).toBeInstanceOf(LimitsExceededError)
        const expectedErrorUsd = `Cannot transfer more than ${centsToUsdString(
          accountLimits.intraLedgerLimit,
        )} in 24 hours`
        expect((paymentResultUsd as Error).message).toBe(expectedErrorUsd)
      }

      {
        // Succeeds for same payment just above withdrawal limit
        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: Number(btcAmountAboveThreshold.amount),
        })

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: request,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).not.toBeInstanceOf(Error)
        expect(paymentResult).toBe(PaymentSendStatus.Success)
      }

      {
        // Succeeds for same payment just above tradeIntraAccount limit
        const lnInvoice = await Wallets.addInvoiceForSelfForUsdWallet({
          walletId: usdWalletDescriptor.id,
          amount: Number(usdAmountAboveThreshold.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice
        const { paymentRequest: uncheckedPaymentRequest } = lnInvoice

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).not.toBeInstanceOf(Error)
        expect(paymentResult).toBe(PaymentSendStatus.Success)
      }
    })

    it("fails to pay when tradeIntraAccountLimit exceeded", async () => {
      // Create and fund new wallets
      const btcFundingAmount = await btcAmountFromUsdNumber(
        MOCKED_BALANCE_ABOVE_THRESHOLD,
      )
      const usdFundingAmount = paymentAmountFromNumber({
        amount: MOCKED_BALANCE_ABOVE_THRESHOLD,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      const { btcWalletDescriptor, usdWalletDescriptor } =
        await createRandomUserAndWallets()
      await fundWallet({
        walletId: btcWalletDescriptor.id,
        balanceAmount: btcFundingAmount,
      })
      await fundWallet({
        walletId: usdWalletDescriptor.id,
        balanceAmount: usdFundingAmount,
      })

      const senderAccount = await AccountsRepository().findById(
        btcWalletDescriptor.accountId,
      )
      if (senderAccount instanceof Error) throw senderAccount

      // Succeeds for multiple payments below limit
      const numPayments = 2
      const { partialBtcSendAmount, partialUsdSendAmount } =
        await getPartialAmountsForMultiplePaymentsBelowLimit({
          limit: "tradeIntraAccountLimit",
          numPayments,
        })
      {
        const lnInvoice = await Wallets.addInvoiceForSelfForUsdWallet({
          walletId: usdWalletDescriptor.id,
          amount: Number(partialUsdSendAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice
        const { paymentRequest: uncheckedPaymentRequest } = lnInvoice

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).not.toBeInstanceOf(Error)
        expect(paymentResult).toBe(PaymentSendStatus.Success)
      }
      {
        const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
          walletId: btcWalletDescriptor.id,
          amount: Number(partialBtcSendAmount.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice
        const { paymentRequest: uncheckedPaymentRequest } = lnInvoice

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest,
          memo: null,
          senderWalletId: usdWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).not.toBeInstanceOf(Error)
        expect(paymentResult).toBe(PaymentSendStatus.Success)
      }

      const btcAmountAboveThreshold = await btcAmountFromUsdNumber(AMOUNT_ABOVE_THRESHOLD)
      const usdAmountAboveThreshold = paymentAmountFromNumber({
        amount: AMOUNT_ABOVE_THRESHOLD,
        currency: WalletCurrency.Usd,
      })
      if (usdAmountAboveThreshold instanceof Error) throw usdAmountAboveThreshold

      {
        // Fails for payment just above limit, from btc
        const lnInvoice = await Wallets.addInvoiceForSelfForUsdWallet({
          walletId: usdWalletDescriptor.id,
          amount: Number(usdAmountAboveThreshold.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice
        const { paymentRequest: uncheckedPaymentRequest } = lnInvoice

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).toBeInstanceOf(LimitsExceededError)
        const expectedError = `Cannot transfer more than ${centsToUsdString(
          accountLimits.tradeIntraAccountLimit,
        )} in 24 hours`
        expect((paymentResult as Error).message).toBe(expectedError)
      }

      {
        // Fails for payment just above limit, from usd
        const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
          walletId: btcWalletDescriptor.id,
          amount: Number(btcAmountAboveThreshold.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice
        const { paymentRequest: uncheckedPaymentRequest } = lnInvoice

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest,
          memo: null,
          senderWalletId: usdWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).toBeInstanceOf(LimitsExceededError)
        const expectedError = `Cannot transfer more than ${centsToUsdString(
          accountLimits.tradeIntraAccountLimit,
        )} in 24 hours`
        expect((paymentResult as Error).message).toBe(expectedError)
      }

      {
        // Succeeds for same payment just above withdrawal limit
        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: Number(btcAmountAboveThreshold.amount),
        })

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: request,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).not.toBeInstanceOf(Error)
        expect(paymentResult).toBe(PaymentSendStatus.Success)
      }

      {
        // Succeeds for same payment just above intraledger limit
        const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
          walletId: otherBtcWallet.id,
          amount: Number(btcAmountAboveThreshold.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice
        const { paymentRequest: uncheckedPaymentRequest } = lnInvoice

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).not.toBeInstanceOf(Error)
        expect(paymentResult).toBe(PaymentSendStatus.Success)
      }
    })

    it("fails to pay when withdrawalLimit exceeded", async () => {
      // Create and fund new wallets
      const btcFundingAmount = await btcAmountFromUsdNumber(
        MOCKED_BALANCE_ABOVE_THRESHOLD,
      )
      const usdFundingAmount = paymentAmountFromNumber({
        amount: MOCKED_BALANCE_ABOVE_THRESHOLD,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      const { btcWalletDescriptor, usdWalletDescriptor } =
        await createRandomUserAndWallets()
      await fundWallet({
        walletId: btcWalletDescriptor.id,
        balanceAmount: btcFundingAmount,
      })
      await fundWallet({
        walletId: usdWalletDescriptor.id,
        balanceAmount: usdFundingAmount,
      })

      const senderAccount = await AccountsRepository().findById(
        btcWalletDescriptor.accountId,
      )
      if (senderAccount instanceof Error) throw senderAccount

      // Succeeds for multiple payments below limit
      const numPayments = 2
      const { partialBtcSendAmount } =
        await getPartialAmountsForMultiplePaymentsBelowLimit({
          limit: "withdrawalLimit",
          numPayments,
        })
      for (let i = 0; i < numPayments; i++) {
        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: Number(partialBtcSendAmount.amount),
        })

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: request,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).not.toBeInstanceOf(Error)
        expect(paymentResult).toBe(PaymentSendStatus.Success)
      }

      const btcAmountAboveThreshold = await btcAmountFromUsdNumber(AMOUNT_ABOVE_THRESHOLD)
      const usdAmountAboveThreshold = paymentAmountFromNumber({
        amount: AMOUNT_ABOVE_THRESHOLD,
        currency: WalletCurrency.Usd,
      })
      if (usdAmountAboveThreshold instanceof Error) throw usdAmountAboveThreshold

      {
        // Fails for payment just above limit
        const { request } = await createInvoice({
          lnd: lndOutside1,
          tokens: Number(btcAmountAboveThreshold.amount),
        })

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest: request,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).toBeInstanceOf(LimitsExceededError)
        const expectedError = `Cannot transfer more than ${centsToUsdString(
          accountLimits.withdrawalLimit,
        )} in 24 hours`
        expect((paymentResult as Error).message).toBe(expectedError)
      }

      {
        // Succeeds for same payment just above intraledger limit
        const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
          walletId: otherBtcWallet.id,
          amount: Number(btcAmountAboveThreshold.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice
        const { paymentRequest: uncheckedPaymentRequest } = lnInvoice

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).not.toBeInstanceOf(Error)
        expect(paymentResult).toBe(PaymentSendStatus.Success)
      }

      {
        // Succeeds for same payment just above tradeIntraAccount limit
        const lnInvoice = await Wallets.addInvoiceForSelfForUsdWallet({
          walletId: usdWalletDescriptor.id,
          amount: Number(usdAmountAboveThreshold.amount),
        })
        if (lnInvoice instanceof Error) throw lnInvoice
        const { paymentRequest: uncheckedPaymentRequest } = lnInvoice

        const paymentResult = await Payments.payInvoiceByWalletId({
          uncheckedPaymentRequest,
          memo: null,
          senderWalletId: btcWalletDescriptor.id,
          senderAccount,
        })
        expect(paymentResult).not.toBeInstanceOf(Error)
        expect(paymentResult).toBe(PaymentSendStatus.Success)
      }
    })
  })
})
