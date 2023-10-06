import { toCents } from "@/domain/fiat"
import { ActivityChecker } from "@/domain/ledger/activity-checker"
import { WalletPriceRatio } from "@/domain/payments"
import { WalletCurrency } from "@/domain/shared"

let btcWallet: Wallet, usdWallet: Wallet

const priceRatio = WalletPriceRatio({
  usd: { amount: BigInt(2), currency: WalletCurrency.Usd },
  btc: { amount: BigInt(1), currency: WalletCurrency.Btc },
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

describe("ActivityChecker with Sats", () => {
  it("aboveThreshold returns false below threshold", async () => {
    const getVolumeAmountFn = (() =>
      Promise.resolve({
        outgoingBaseAmount: { amount: BigInt(11), currency: WalletCurrency.Btc },
        incomingBaseAmount: { amount: BigInt(10), currency: WalletCurrency.Btc },
      })) as GetVolumeAmountFn
    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold: toCents(100),
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet])
    expect(resultIncoming).toBe(false)
  })

  it("Returns true if outgoing or incoming sats are above threshold", async () => {
    let getVolumeAmountFn = (() =>
      Promise.resolve({
        outgoingBaseAmount: { amount: BigInt(500), currency: WalletCurrency.Btc },
        incomingBaseAmount: { amount: BigInt(10), currency: WalletCurrency.Btc },
      })) as GetVolumeAmountFn
    let checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold: toCents(100),
      getVolumeAmountFn,
    })

    const resultOutgoing = await checker.aboveThreshold([btcWallet])
    expect(resultOutgoing).toBe(true)

    getVolumeAmountFn = (() =>
      Promise.resolve({
        outgoingBaseAmount: { amount: BigInt(10), currency: WalletCurrency.Btc },
        incomingBaseAmount: { amount: BigInt(500), currency: WalletCurrency.Btc },
      })) as GetVolumeAmountFn
    checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold: toCents(100),
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet])
    expect(resultIncoming).toBe(true)
  })
})

describe("ActivityChecker with Cents", () => {
  it("aboveThreshold returns false below threshold", async () => {
    const getVolumeAmountFn = (() =>
      Promise.resolve({
        outgoingBaseAmount: { amount: BigInt(11), currency: WalletCurrency.Usd },
        incomingBaseAmount: { amount: BigInt(10), currency: WalletCurrency.Usd },
      })) as GetVolumeAmountFn
    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold: toCents(100),
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([usdWallet])
    expect(resultIncoming).toBe(false)
  })

  it("Returns true if outgoing or incoming sats are above threshold", async () => {
    let getVolumeAmountFn = (() =>
      Promise.resolve({
        outgoingBaseAmount: { amount: BigInt(500), currency: WalletCurrency.Usd },
        incomingBaseAmount: { amount: BigInt(10), currency: WalletCurrency.Usd },
      })) as GetVolumeAmountFn
    let checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold: toCents(100),
      getVolumeAmountFn,
    })

    const resultOutgoing = await checker.aboveThreshold([usdWallet])
    expect(resultOutgoing).toBe(true)

    getVolumeAmountFn = (() =>
      Promise.resolve({
        outgoingBaseAmount: { amount: BigInt(10), currency: WalletCurrency.Usd },
        incomingBaseAmount: { amount: BigInt(500), currency: WalletCurrency.Usd },
      })) as GetVolumeAmountFn
    checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold: toCents(100),
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([usdWallet])
    expect(resultIncoming).toBe(true)
  })
})

describe("ActivityChecker with Cents+Sats wallets", () => {
  it("below threshold", async () => {
    const getVolumeAmountFn = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          outgoingBaseAmount: { amount: BigInt(0), currency: WalletCurrency.Btc },
          incomingBaseAmount: { amount: BigInt(10), currency: WalletCurrency.Btc },
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          outgoingBaseAmount: { amount: BigInt(0), currency: WalletCurrency.Usd },
          incomingBaseAmount: { amount: BigInt(50), currency: WalletCurrency.Usd },
        }),
      )

    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold: toCents(100),
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet, usdWallet])
    expect(resultIncoming).toBe(false)
  })
  it("above threshold", async () => {
    const getVolumeAmountFn = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          outgoingBaseAmount: { amount: BigInt(0), currency: WalletCurrency.Btc },
          incomingBaseAmount: { amount: BigInt(30), currency: WalletCurrency.Btc },
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          outgoingBaseAmount: { amount: BigInt(0), currency: WalletCurrency.Usd },
          incomingBaseAmount: { amount: BigInt(90), currency: WalletCurrency.Usd },
        }),
      )

    const checker = ActivityChecker({
      priceRatio,
      monthlyVolumeThreshold: toCents(100),
      getVolumeAmountFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet, usdWallet])
    expect(resultIncoming).toBe(true)
  })
})
