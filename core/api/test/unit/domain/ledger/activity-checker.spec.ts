import { toCents } from "@/domain/fiat"
import { ActivityChecker } from "@/domain/ledger/activity-checker"
import { WalletPriceRatio } from "@/domain/payments"
import { AmountCalculator, ONE_CENT, WalletCurrency } from "@/domain/shared"

let btcWallet: Wallet, usdWallet: Wallet

const calc = AmountCalculator()

const priceRatio = WalletPriceRatio({
  usd: { amount: BigInt(1), currency: WalletCurrency.Usd },
  btc: { amount: BigInt(20), currency: WalletCurrency.Btc },
}) as WalletPriceRatio

beforeAll(() => {
  btcWallet = {
    id: "walletId" as WalletId,
    type: "checking",
    currency: WalletCurrency.Btc,
    accountId: "a1" as AccountId,
    onChainAddressIdentifiers: [],
    onChainAddresses: () => [],
  }

  usdWallet = {
    id: "walletId" as WalletId,
    type: "checking",
    currency: WalletCurrency.Usd,
    accountId: "a1" as AccountId,
    onChainAddressIdentifiers: [],
    onChainAddresses: () => [],
  }
})

const monthlyVolumeThreshold = toCents(100)

describe("ActivityChecker with Sats", () => {
  it("aboveThreshold returns false below", async () => {
    const btcPaymentAmount = {
      amount: BigInt(1500),
      currency: WalletCurrency.Btc,
    }

    const usdPaymentAmount = priceRatio.convertFromBtc(btcPaymentAmount)
    if (usdPaymentAmount instanceof Error) throw usdPaymentAmount

    expect(toCents(usdPaymentAmount.amount)).toBeLessThan(monthlyVolumeThreshold)

    const getVolumeAmountFn = (() =>
      Promise.resolve(btcPaymentAmount)) as NewGetVolumeAmountSinceFn
    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold,
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet])
    expect(resultIncoming).toBe(false)
  })

  it("aboveThreshold returns false at threshold", async () => {
    const btcPaymentAmount = {
      amount: BigInt(2000),
      currency: WalletCurrency.Btc,
    }

    const usdPaymentAmount = priceRatio.convertFromBtc(btcPaymentAmount)
    if (usdPaymentAmount instanceof Error) throw usdPaymentAmount

    expect(toCents(usdPaymentAmount.amount)).toEqual(monthlyVolumeThreshold)

    const getVolumeAmountFn = (() =>
      Promise.resolve(btcPaymentAmount)) as NewGetVolumeAmountSinceFn
    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold,
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet])
    expect(resultIncoming).toBe(false)
  })

  it("aboveThreshold returns true above threshold", async () => {
    const btcPaymentAmount = {
      amount: BigInt(2500),
      currency: WalletCurrency.Btc,
    }

    const usdPaymentAmount = priceRatio.convertFromBtc(btcPaymentAmount)
    if (usdPaymentAmount instanceof Error) throw usdPaymentAmount

    expect(toCents(usdPaymentAmount.amount)).toBeGreaterThan(monthlyVolumeThreshold)

    const getVolumeAmountFn = (() =>
      Promise.resolve(btcPaymentAmount)) as NewGetVolumeAmountSinceFn
    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold,
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet])
    expect(resultIncoming).toBe(true)
  })
})

describe("ActivityChecker with Cents", () => {
  it("aboveThreshold returns false below threshold", async () => {
    const usdPaymentAmount = {
      amount: BigInt(99),
      currency: WalletCurrency.Usd,
    }
    expect(toCents(usdPaymentAmount.amount)).toBeLessThan(monthlyVolumeThreshold)

    const getVolumeAmountFn = (() =>
      Promise.resolve(usdPaymentAmount)) as NewGetVolumeAmountSinceFn
    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold,
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([usdWallet])
    expect(resultIncoming).toBe(false)
  })

  it("aboveThreshold returns false at threshold", async () => {
    const usdPaymentAmount = {
      amount: BigInt(100),
      currency: WalletCurrency.Usd,
    }
    expect(toCents(usdPaymentAmount.amount)).toEqual(monthlyVolumeThreshold)

    const getVolumeAmountFn = (() =>
      Promise.resolve({
        amount: BigInt(100),
        currency: WalletCurrency.Usd,
      })) as NewGetVolumeAmountSinceFn
    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold,
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([usdWallet])
    expect(resultIncoming).toBe(false)
  })

  it("aboveThreshold returns true above threshold", async () => {
    const usdPaymentAmount = {
      amount: BigInt(101),
      currency: WalletCurrency.Usd,
    }
    expect(toCents(usdPaymentAmount.amount)).toBeGreaterThan(monthlyVolumeThreshold)

    const getVolumeAmountFn = (() =>
      Promise.resolve(usdPaymentAmount)) as NewGetVolumeAmountSinceFn
    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold,
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([usdWallet])
    expect(resultIncoming).toBe(true)
  })
})

describe("ActivityChecker with Cents+Sats wallets", () => {
  it("aboveThreshold returns false below threshold", async () => {
    const btcPaymentAmount = {
      amount: BigInt(1500),
      currency: WalletCurrency.Btc,
    }

    const usdPaymentAmount = priceRatio.convertFromBtc(btcPaymentAmount)
    if (usdPaymentAmount instanceof Error) throw usdPaymentAmount

    const totalUsdPaymentAmount = calc.add(usdPaymentAmount, ONE_CENT)
    expect(toCents(totalUsdPaymentAmount.amount)).toBeLessThan(monthlyVolumeThreshold)

    const getVolumeAmountFn = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(btcPaymentAmount))
      .mockImplementationOnce(() => Promise.resolve(ONE_CENT))

    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold,
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet, usdWallet])
    expect(resultIncoming).toBe(false)
  })

  it("aboveThreshold returns false at threshold", async () => {
    const btcPaymentAmount = {
      amount: BigInt(1990),
      currency: WalletCurrency.Btc,
    }

    const usdPaymentAmount = priceRatio.convertFromBtc(btcPaymentAmount)
    if (usdPaymentAmount instanceof Error) throw usdPaymentAmount

    const totalUsdPaymentAmount = calc.add(usdPaymentAmount, ONE_CENT)
    expect(toCents(totalUsdPaymentAmount.amount)).toEqual(monthlyVolumeThreshold)

    const getVolumeAmountFn = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(btcPaymentAmount))
      .mockImplementationOnce(() => Promise.resolve(ONE_CENT))

    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold,
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet, usdWallet])
    expect(resultIncoming).toBe(false)
  })

  it("aboveThreshold returns true above threshold", async () => {
    const btcPaymentAmount = {
      amount: BigInt(2000),
      currency: WalletCurrency.Btc,
    }

    const usdPaymentAmount = priceRatio.convertFromBtc(btcPaymentAmount)
    if (usdPaymentAmount instanceof Error) throw usdPaymentAmount

    const totalUsdPaymentAmount = calc.add(usdPaymentAmount, ONE_CENT)
    expect(toCents(totalUsdPaymentAmount.amount)).toBeGreaterThan(monthlyVolumeThreshold)

    const getVolumeAmountFn = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(btcPaymentAmount))
      .mockImplementationOnce(() => Promise.resolve(ONE_CENT))

    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold,
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet, usdWallet])
    expect(resultIncoming).toBe(true)
  })
})
