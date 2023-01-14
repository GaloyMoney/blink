import { Payments, Wallets } from "@app"
import { getMidPriceRatio } from "@app/shared"

import { getDealerConfig } from "@config"

import { PaymentSendStatus } from "@domain/bitcoin/lightning"
import { LimitsExceededError } from "@domain/errors"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"
import { DealerPriceService } from "@services/dealer-price"

import { AccountsRepository } from "@services/mongoose"

import {
  addNewWallet,
  checkIsBalanced,
  createAndFundNewWallet,
  createInvoice,
  randomAccount,
  lndOutside1,
} from "test/helpers"

const MOCKED_LIMIT = 100 as UsdCents
const AMOUNT_ABOVE_THRESHOLD = 10 as UsdCents
const MOCKED_BALANCE_ABOVE_THRESHOLD = (MOCKED_LIMIT + 20) as UsdCents
const accountLimits: IAccountLimits = {
  intraLedgerLimit: MOCKED_LIMIT,
  withdrawalLimit: MOCKED_LIMIT,
  tradeIntraAccountLimit: MOCKED_LIMIT,
}

jest.mock("@config", () => {
  const config = jest.requireActual("@config")
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

const dealerFns = DealerPriceService()
const dealerUsdFromBtc = dealerFns.getCentsFromSatsForImmediateSell

const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled

let accountId: AccountId
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

beforeEach(async () => {
  accountId = (await randomAccount()).id
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

type limitsTest = ({
  testSuccess,
  btcPaymentAmount,
  sendFromUsdWallet,
}: {
  testSuccess: boolean
  btcPaymentAmount: BtcPaymentAmount
  sendFromUsdWallet?: boolean
}) => Promise<void>

const successLimitsPaymentTests = ({
  senderBtcWallet,
  senderAccount,
  senderUsdWallet,
}: {
  senderBtcWallet: Wallet
  senderAccount: Account
  senderUsdWallet?: Wallet
}): Record<keyof IAccountLimits, limitsTest> => {
  const withdrawalLimit = async ({
    testSuccess,
    btcPaymentAmount,
  }: {
    testSuccess: boolean
    btcPaymentAmount: BtcPaymentAmount
  }) => {
    const { request } = await createInvoice({
      lnd: lndOutside1,
      tokens: Number(btcPaymentAmount.amount),
    })

    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: request,
      memo: null,
      senderWalletId: senderBtcWallet.id,
      senderAccount,
    })

    if (testSuccess) {
      expect(paymentResult).not.toBeInstanceOf(Error)
      expect(paymentResult).toBe(PaymentSendStatus.Success)
    } else {
      expect(paymentResult).toBeInstanceOf(LimitsExceededError)
      const expectedError = `Cannot transfer more than ${centsToUsdString(
        accountLimits.withdrawalLimit,
      )} in 24 hours`
      expect((paymentResult as Error).message).toBe(expectedError)
    }

    if (!testSuccess && senderUsdWallet) {
      const paymentResult = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: request,
        memo: null,
        senderWalletId: senderUsdWallet.id,
        senderAccount,
      })
      expect(paymentResult).toBeInstanceOf(LimitsExceededError)
      const expectedError = `Cannot transfer more than ${centsToUsdString(
        accountLimits.intraLedgerLimit,
      )} in 24 hours`
      expect((paymentResult as Error).message).toBe(expectedError)
    }
  }

  const intraLedgerLimit = async ({
    testSuccess,
    btcPaymentAmount,
  }: {
    testSuccess: boolean
    btcPaymentAmount: BtcPaymentAmount
  }) => {
    const lnInvoice = await Wallets.addInvoiceForSelfForBtcWallet({
      walletId: otherBtcWallet.id,
      amount: Number(btcPaymentAmount.amount),
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: request } = lnInvoice

    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: request,
      memo: null,
      senderWalletId: senderBtcWallet.id,
      senderAccount,
    })

    if (testSuccess) {
      expect(paymentResult).not.toBeInstanceOf(Error)
      expect(paymentResult).toBe(PaymentSendStatus.Success)
    } else {
      expect(paymentResult).toBeInstanceOf(LimitsExceededError)
      const expectedError = `Cannot transfer more than ${centsToUsdString(
        accountLimits.intraLedgerLimit,
      )} in 24 hours`
      expect((paymentResult as Error).message).toBe(expectedError)
    }

    if (!testSuccess && senderUsdWallet) {
      const paymentResult = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest: request,
        memo: null,
        senderWalletId: senderUsdWallet.id,
        senderAccount,
      })
      expect(paymentResult).toBeInstanceOf(LimitsExceededError)
      const expectedError = `Cannot transfer more than ${centsToUsdString(
        accountLimits.intraLedgerLimit,
      )} in 24 hours`
      expect((paymentResult as Error).message).toBe(expectedError)
    }
  }

  const tradeIntraAccountLimit = async ({
    testSuccess,
    btcPaymentAmount,
    sendFromUsdWallet,
  }: {
    testSuccess: boolean
    btcPaymentAmount: BtcPaymentAmount
    sendFromUsdWallet?: boolean
  }) => {
    if (senderUsdWallet === undefined) throw new Error("'senderUsdWallet' undefined")
    expect(senderBtcWallet.accountId).toEqual(senderUsdWallet.accountId)

    const usdPaymentAmount = await dealerUsdFromBtc(btcPaymentAmount)
    if (usdPaymentAmount instanceof Error) throw usdPaymentAmount

    const { senderWallet, recipientWallet, receiveAmount } = sendFromUsdWallet
      ? {
          senderWallet: senderUsdWallet,
          recipientWallet: senderBtcWallet,
          receiveAmount: Number(btcPaymentAmount.amount),
        }
      : {
          senderWallet: senderBtcWallet,
          recipientWallet: senderUsdWallet,
          receiveAmount: Number(usdPaymentAmount.amount),
        }

    const addInvoiceFn =
      recipientWallet.currency === WalletCurrency.Btc
        ? Wallets.addInvoiceForSelfForBtcWallet
        : Wallets.addInvoiceForSelfForUsdWallet
    const lnInvoice = await addInvoiceFn({
      walletId: recipientWallet.id,
      amount: receiveAmount,
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: uncheckedPaymentRequest } = lnInvoice

    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest,
      memo: null,
      senderWalletId: senderWallet.id,
      senderAccount,
    })

    if (testSuccess) {
      expect(paymentResult).not.toBeInstanceOf(Error)
      expect(paymentResult).toBe(PaymentSendStatus.Success)
    } else {
      expect(paymentResult).toBeInstanceOf(LimitsExceededError)
      const expectedError = `Cannot transfer more than ${centsToUsdString(
        accountLimits.tradeIntraAccountLimit,
      )} in 24 hours`
      expect((paymentResult as Error).message).toBe(expectedError)
    }

    if (!testSuccess) {
      const addInvoiceFn =
        senderWallet.currency === WalletCurrency.Btc
          ? Wallets.addInvoiceForSelfForBtcWallet
          : Wallets.addInvoiceForSelfForUsdWallet
      const lnInvoice = await addInvoiceFn({
        walletId: senderWallet.id,
        amount:
          senderWallet.currency === WalletCurrency.Btc
            ? Number(btcPaymentAmount.amount)
            : Number(usdPaymentAmount.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice
      const { paymentRequest: uncheckedPaymentRequest } = lnInvoice

      const paymentResult = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: recipientWallet.id,
        senderAccount,
      })
      expect(paymentResult).toBeInstanceOf(LimitsExceededError)
      const expectedError = `Cannot transfer more than ${centsToUsdString(
        accountLimits.tradeIntraAccountLimit,
      )} in 24 hours`
      expect((paymentResult as Error).message).toBe(expectedError)
    }
  }

  return { withdrawalLimit, intraLedgerLimit, tradeIntraAccountLimit }
}

describe("UserWallet Limits - Lightning Pay", () => {
  describe("single payment above limit fails limit check", () => {
    it("fails to pay when withdrawalLimit exceeded", async () => {
      accountId = (await randomAccount()).id

      // Create new wallet
      const newWallet = await createAndFundNewWallet({
        accountId,
        balanceAmount: await btcAmountFromUsdNumber(MOCKED_BALANCE_ABOVE_THRESHOLD),
      })

      // Test limits
      const usdAmountAboveThreshold =
        accountLimits.withdrawalLimit + AMOUNT_ABOVE_THRESHOLD
      const btcThresholdAmount = await btcAmountFromUsdNumber(usdAmountAboveThreshold)

      const senderAccount = await AccountsRepository().findById(newWallet.accountId)
      if (senderAccount instanceof Error) throw senderAccount

      await successLimitsPaymentTests({
        senderBtcWallet: newWallet,
        senderAccount,
      }).withdrawalLimit({ testSuccess: false, btcPaymentAmount: btcThresholdAmount })
    })

    it("fails to pay when amount exceeds intraLedger limit", async () => {
      // Create new wallet
      const newWallet = await createAndFundNewWallet({
        accountId,
        balanceAmount: await btcAmountFromUsdNumber(MOCKED_BALANCE_ABOVE_THRESHOLD),
      })

      // Test limits
      const usdAmountAboveThreshold =
        accountLimits.intraLedgerLimit + AMOUNT_ABOVE_THRESHOLD
      const btcThresholdAmount = await btcAmountFromUsdNumber(usdAmountAboveThreshold)

      const senderAccount = await AccountsRepository().findById(newWallet.accountId)
      if (senderAccount instanceof Error) throw senderAccount

      await successLimitsPaymentTests({
        senderBtcWallet: newWallet,
        senderAccount,
      }).intraLedgerLimit({ testSuccess: false, btcPaymentAmount: btcThresholdAmount })
    })

    it("fails to pay when amount exceeds tradeIntraAccount limit", async () => {
      const usdFundingAmount = paymentAmountFromNumber({
        amount: MOCKED_BALANCE_ABOVE_THRESHOLD,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // Create new wallets
      const newBtcWallet = await createAndFundNewWallet({
        accountId,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWallet({
        accountId,
        balanceAmount: usdFundingAmount,
      })

      // Test limits
      const usdAmountAboveThreshold =
        accountLimits.tradeIntraAccountLimit + AMOUNT_ABOVE_THRESHOLD
      const btcThresholdAmount = await btcAmountFromUsdNumber(usdAmountAboveThreshold)

      const senderAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (senderAccount instanceof Error) throw senderAccount

      await successLimitsPaymentTests({
        senderBtcWallet: newBtcWallet,
        senderAccount,
        senderUsdWallet: newUsdWallet,
      }).tradeIntraAccountLimit({
        testSuccess: false,
        btcPaymentAmount: btcThresholdAmount,
      })
    })
  })

  describe("multiple payments up to limit succeed, last payment fails", () => {
    const multiplePaymentLimitTests = async (limit: keyof IAccountLimits) => {
      const otherLimits = Object.keys(accountLimits).filter((val) => val !== limit)

      // Create new wallet
      const usdFundingAmount = paymentAmountFromNumber({
        amount: MOCKED_BALANCE_ABOVE_THRESHOLD,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      const newBtcWallet = await createAndFundNewWallet({
        accountId,
        balanceAmount: await btcAmountFromUsdNumber(MOCKED_BALANCE_ABOVE_THRESHOLD),
      })

      const newUsdWallet = await createAndFundNewWallet({
        accountId,
        balanceAmount: usdFundingAmount,
      })

      // Construct payments
      const SPLITS = 2
      let partialUsdSendAmount = Math.floor(accountLimits[limit] / SPLITS)
      const bufferForSpread = 2
      partialUsdSendAmount -= bufferForSpread
      const partialBtcSendAmount = await btcAmountFromUsdNumber(partialUsdSendAmount)

      const usdAmountAboveThreshold = AMOUNT_ABOVE_THRESHOLD
      const btcAmountAboveThreshold = await btcAmountFromUsdNumber(
        usdAmountAboveThreshold,
      )

      // Check constructed amounts
      const checkPartialUsdAmount = await dealerUsdFromBtc(partialBtcSendAmount)
      if (checkPartialUsdAmount instanceof Error) throw checkPartialUsdAmount
      const expectedUsdSuccessfulAmount = checkPartialUsdAmount.amount * BigInt(SPLITS)
      expect(expectedUsdSuccessfulAmount).toBeLessThan(accountLimits[limit])

      const checkUsdAboveThreshold = await dealerUsdFromBtc(btcAmountAboveThreshold)
      if (checkUsdAboveThreshold instanceof Error) throw checkUsdAboveThreshold
      expect(expectedUsdSuccessfulAmount + checkUsdAboveThreshold.amount).toBeGreaterThan(
        accountLimits[limit],
      )

      // Test direct limits
      const senderAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (senderAccount instanceof Error) throw senderAccount

      const limitTests = successLimitsPaymentTests({
        senderBtcWallet: newBtcWallet,
        senderAccount,
        senderUsdWallet: newUsdWallet,
      })

      // Succeeds for multiple payments below limit
      for (let i = 0; i < SPLITS; i++) {
        await limitTests[limit]({
          testSuccess: true,
          btcPaymentAmount: partialBtcSendAmount,
          sendFromUsdWallet: i % 2 === 0, // alternate usd wallet for tradeIntraAccount tests
        })
      }

      // Fails for payment just above limit
      await limitTests[limit]({
        testSuccess: false,
        btcPaymentAmount: btcAmountAboveThreshold,
      })

      // Test indirect limits
      for (const otherLimit of otherLimits) {
        // Succeeds for same payment just above other limits
        await limitTests[otherLimit]({
          testSuccess: true,
          btcPaymentAmount: btcAmountAboveThreshold,
        })
      }
    }

    const limits = Object.keys(accountLimits) as (keyof IAccountLimits)[]
    for (const limit of limits) {
      it(`fails to pay when ${limit} exceeded`, async () =>
        multiplePaymentLimitTests(limit))
    }
  })
})
