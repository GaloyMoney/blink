import { Payments, Wallets } from "@app"
import { getMidPriceRatio } from "@app/shared"

import { getDealerConfig } from "@config"

import { LimitsExceededError } from "@domain/errors"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"

import { baseLogger } from "@services/logger"
import { AccountsRepository } from "@services/mongoose"

import { sleep } from "@utils"

import {
  checkIsBalanced,
  createInvoice,
  createNewWalletFromPhone,
  lndOutside1,
  pay,
  randomPhone,
} from "test/helpers"

jest.mock("@app/prices/get-current-price", () => require("test/mocks/get-current-price"))

jest.mock("@services/dealer-price", () => require("test/mocks/dealer-price"))

const MOCKED_LIMIT = 100 as UsdCents
const accountLimits: IAccountLimits = {
  intraLedgerLimit: MOCKED_LIMIT,
  withdrawalLimit: MOCKED_LIMIT,
  tradeIntraAccountLimit: MOCKED_LIMIT,
}

jest.mock("@config", () => {
  return {
    ...jest.requireActual("@config"),
    getAccountLimits: jest.fn().mockReturnValue({
      intraLedgerLimit: 100 as UsdCents,
      withdrawalLimit: 100 as UsdCents,
      tradeIntraAccountLimit: 100 as UsdCents,
    }),
  }
})

const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled

let otherPhone: PhoneNumber
let otherBtcWallet: Wallet
let otherUsdWallet: Wallet // eslint-disable-line @typescript-eslint/no-unused-vars

beforeAll(async () => {
  otherPhone = randomPhone()

  const btcWallet = await createNewWalletFromPhone({
    phone: otherPhone,
    currency: WalletCurrency.Btc,
  })
  if (btcWallet instanceof Error) throw btcWallet
  otherBtcWallet = btcWallet

  const usdWallet = await createNewWalletFromPhone({
    phone: otherPhone,
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

const createAndFundNewWalletForPhone = async <S extends WalletCurrency>({
  phone,
  balanceAmount,
}: {
  phone: PhoneNumber
  balanceAmount: PaymentAmount<S>
}) => {
  // Create new wallet
  const wallet = await createNewWalletFromPhone({
    phone,
    currency: balanceAmount.currency,
  })
  if (wallet instanceof Error) throw wallet

  // Fund new wallet if a non-zero balance is passed
  if (balanceAmount.amount === 0n) return wallet

  const lnInvoice = await Wallets.addInvoiceForSelf({
    walletId: wallet.id,
    amount: Number(balanceAmount.amount),
    memo: `Fund new wallet ${wallet.id}`,
  })
  if (lnInvoice instanceof Error) throw lnInvoice
  const { paymentRequest: invoice, paymentHash } = lnInvoice

  const updateInvoice = () =>
    Wallets.updatePendingInvoiceByPaymentHash({
      paymentHash,
      logger: baseLogger,
    })

  const promises = Promise.all([
    pay({ lnd: lndOutside1, request: invoice }),
    (async () => {
      // TODO: we could use event instead of a sleep to lower test latency
      await sleep(500)
      return updateInvoice()
    })(),
  ])

  {
    // first arg is the outsideLndpayResult
    const [, result] = await promises
    expect(result).not.toBeInstanceOf(Error)
  }

  return wallet
}

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
  const phone = randomPhone()

  describe("single payment above limit fails limit check", () => {
    it("fails to pay when withdrawalLimit exceeded", async () => {
      // Create new wallet
      const newWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(MOCKED_LIMIT + 20),
      })

      // Test limits
      const usdAmountAboveThreshold = accountLimits.withdrawalLimit + 10
      const btcThresholdAmount = await btcAmountFromUsdNumber(usdAmountAboveThreshold)

      const senderAccount = await AccountsRepository().findById(newWallet.accountId)
      if (senderAccount instanceof Error) throw senderAccount

      const { request: uncheckedPaymentRequest } = await createInvoice({
        lnd: lndOutside1,
        tokens: Number(btcThresholdAmount.amount),
      })

      const paymentResult = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: newWallet.id,
        senderAccount,
      })

      expect(paymentResult).toBeInstanceOf(LimitsExceededError)
      const expectedError = `Cannot transfer more than ${accountLimits.withdrawalLimit} cents in 24 hours`
      expect((paymentResult as Error).message).toBe(expectedError)
    })

    it("fails to pay when amount exceeds intraLedger limit", async () => {
      // Create new wallet
      const newWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(MOCKED_LIMIT + 20),
      })

      // Test limits
      const usdAmountAboveThreshold = accountLimits.intraLedgerLimit + 10
      const btcThresholdAmount = await btcAmountFromUsdNumber(usdAmountAboveThreshold)

      const senderAccount = await AccountsRepository().findById(newWallet.accountId)
      if (senderAccount instanceof Error) throw senderAccount

      const lnInvoice = await Wallets.addInvoiceForSelf({
        walletId: otherBtcWallet.id,
        amount: Number(btcThresholdAmount.amount),
      })
      if (lnInvoice instanceof Error) throw lnInvoice
      const { paymentRequest: uncheckedPaymentRequest } = lnInvoice

      const paymentResult = await Payments.payInvoiceByWalletId({
        uncheckedPaymentRequest,
        memo: null,
        senderWalletId: newWallet.id,
        senderAccount,
      })

      expect(paymentResult).toBeInstanceOf(LimitsExceededError)
      const expectedError = `Cannot transfer more than ${accountLimits.intraLedgerLimit} cents in 24 hours`
      expect((paymentResult as Error).message).toBe(expectedError)
    })

    it("fails to pay when amount exceeds tradeIntraAccount limit", async () => {
      const usdFundingAmount = paymentAmountFromNumber({
        amount: MOCKED_LIMIT + 20,
        currency: WalletCurrency.Usd,
      })
      if (usdFundingAmount instanceof Error) throw usdFundingAmount

      // Create new wallets
      const newBtcWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: await btcAmountFromUsdNumber(usdFundingAmount.amount),
      })

      const newUsdWallet = await createAndFundNewWalletForPhone({
        phone,
        balanceAmount: usdFundingAmount,
      })

      // Test limits
      const usdAmountAboveThreshold = accountLimits.tradeIntraAccountLimit + 10
      const btcThresholdAmount = await btcAmountFromUsdNumber(usdAmountAboveThreshold)

      expect(newBtcWallet.accountId).toEqual(newUsdWallet.accountId)
      const senderAccount = await AccountsRepository().findById(newBtcWallet.accountId)
      if (senderAccount instanceof Error) throw senderAccount

      const cases = [
        {
          senderWallet: newBtcWallet,
          recipientWallet: newUsdWallet,
          receiveAmount: usdAmountAboveThreshold,
        },
        {
          senderWallet: newUsdWallet,
          recipientWallet: newBtcWallet,
          receiveAmount: Number(btcThresholdAmount.amount),
        },
      ]
      for (const { senderWallet, recipientWallet, receiveAmount } of cases) {
        const lnInvoice = await Wallets.addInvoiceForSelf({
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

        expect(paymentResult).toBeInstanceOf(LimitsExceededError)
        const expectedError = `Cannot transfer more than ${accountLimits.tradeIntraAccountLimit} cents in 24 hours`
        expect((paymentResult as Error).message).toBe(expectedError)
      }
    })
  })
})
