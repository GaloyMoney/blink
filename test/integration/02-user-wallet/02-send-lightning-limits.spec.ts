import { Payments, Wallets } from "@app"
import { getMidPriceRatio } from "@app/shared"

import { getDealerConfig } from "@config"

import { LimitsExceededError } from "@domain/errors"
import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"

import {
  checkIsBalanced,
  createInvoice,
  createUserAndWalletFromUserRef,
  getAccountByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  lndOutside1,
} from "test/helpers"

jest.mock("@app/prices/get-current-price", () => require("test/mocks/get-current-price"))

jest.mock("@services/dealer-price", () => require("test/mocks/dealer-price"))

const accountLimits: IAccountLimits = {
  intraLedgerLimit: 100 as UsdCents,
  withdrawalLimit: 100 as UsdCents,
  tradeIntraAccountLimit: 100 as UsdCents,
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

let accountB: Account

let walletIdA: WalletId
let walletIdB: WalletId

beforeAll(async () => {
  await createUserAndWalletFromUserRef("A")
  await createUserAndWalletFromUserRef("B")

  accountB = await getAccountByTestUserRef("B")

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  walletIdB = await getDefaultWalletIdByTestUserRef("B")
})

afterEach(async () => {
  await checkIsBalanced()
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("UserWallet Limits - Lightning Pay", () => {
  it("fails to pay when withdrawalLimit exceeded", async () => {
    const usdAmountAboveThreshold = paymentAmountFromNumber({
      amount: accountLimits.withdrawalLimit + 1,
      currency: WalletCurrency.Usd,
    })
    expect(usdAmountAboveThreshold).not.toBeInstanceOf(Error)
    if (usdAmountAboveThreshold instanceof Error) throw usdAmountAboveThreshold

    const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
    if (midPriceRatio instanceof Error) throw midPriceRatio
    const btcThresholdAmount = midPriceRatio.convertFromUsd(usdAmountAboveThreshold)

    const { request } = await createInvoice({
      lnd: lndOutside1,
      tokens: Number(btcThresholdAmount.amount),
    })
    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: request,
      memo: null,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })

    expect(paymentResult).toBeInstanceOf(LimitsExceededError)
    const expectedError = `Cannot transfer more than ${accountLimits.withdrawalLimit} cents in 24 hours`
    expect((paymentResult as Error).message).toBe(expectedError)
  })

  it("fails to pay when amount exceeds intraLedger limit", async () => {
    const usdAmountAboveThreshold = paymentAmountFromNumber({
      amount: accountLimits.intraLedgerLimit + 1,
      currency: WalletCurrency.Usd,
    })
    expect(usdAmountAboveThreshold).not.toBeInstanceOf(Error)
    if (usdAmountAboveThreshold instanceof Error) throw usdAmountAboveThreshold

    const midPriceRatio = await getMidPriceRatio(usdHedgeEnabled)
    if (midPriceRatio instanceof Error) throw midPriceRatio
    const btcThresholdAmount = midPriceRatio.convertFromUsd(usdAmountAboveThreshold)

    const lnInvoice = await Wallets.addInvoiceForSelf({
      walletId: walletIdA as WalletId,
      amount: Number(btcThresholdAmount.amount),
    })
    if (lnInvoice instanceof Error) throw lnInvoice
    const { paymentRequest: request } = lnInvoice

    const paymentResult = await Payments.payInvoiceByWalletId({
      uncheckedPaymentRequest: request,
      memo: null,
      senderWalletId: walletIdB,
      senderAccount: accountB,
    })

    expect(paymentResult).toBeInstanceOf(LimitsExceededError)
    const expectedError = `Cannot transfer more than ${accountLimits.intraLedgerLimit} cents in 24 hours`
    expect((paymentResult as Error).message).toBe(expectedError)
  })
})
