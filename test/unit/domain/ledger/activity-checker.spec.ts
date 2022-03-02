import { toSats } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { ActivityChecker } from "@domain/ledger/activity-checker"
import { WalletCurrency } from "@domain/shared"

import { dCConverter } from "test/unit/helpers"

let btcWallet: Wallet, usdWallet: Wallet

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
    const getVolumeFn = () =>
      Promise.resolve({ outgoingBaseAmount: toSats(11), incomingBaseAmount: toSats(10) })
    const checker = ActivityChecker({
      dCConverter,
      monthlyVolumeThreshold: toCents(100),
      getVolumeFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet])
    expect(resultIncoming).toBe(false)
  })

  it("Returns true if outgoing or incoming sats are above threshold", async () => {
    let getVolumeFn = () =>
      Promise.resolve({ outgoingBaseAmount: toSats(500), incomingBaseAmount: toSats(10) })
    let checker = ActivityChecker({
      dCConverter,
      monthlyVolumeThreshold: toCents(100),
      getVolumeFn,
    })

    const resultOutgoing = await checker.aboveThreshold([btcWallet])
    expect(resultOutgoing).toBe(true)

    getVolumeFn = () =>
      Promise.resolve({ outgoingBaseAmount: toSats(10), incomingBaseAmount: toSats(500) })
    checker = ActivityChecker({
      dCConverter,
      monthlyVolumeThreshold: toCents(100),
      getVolumeFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet])
    expect(resultIncoming).toBe(true)
  })
})

describe("ActivityChecker with Cents", () => {
  it("aboveThreshold returns false below threshold", async () => {
    const getVolumeFn = () =>
      Promise.resolve({
        outgoingBaseAmount: toCents(11),
        incomingBaseAmount: toCents(10),
      })
    const checker = ActivityChecker({
      dCConverter,
      monthlyVolumeThreshold: toCents(100),
      getVolumeFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet])
    expect(resultIncoming).toBe(false)
  })

  it("Returns true if outgoing or incoming sats are above threshold", async () => {
    let getVolumeFn = () =>
      Promise.resolve({
        outgoingBaseAmount: toCents(500),
        incomingBaseAmount: toCents(10),
      })
    let checker = ActivityChecker({
      dCConverter,
      monthlyVolumeThreshold: toCents(100),
      getVolumeFn,
    })

    const resultOutgoing = await checker.aboveThreshold([btcWallet])
    expect(resultOutgoing).toBe(true)

    getVolumeFn = () =>
      Promise.resolve({
        outgoingBaseAmount: toCents(10),
        incomingBaseAmount: toCents(500),
      })
    checker = ActivityChecker({
      dCConverter,
      monthlyVolumeThreshold: toCents(100),
      getVolumeFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet])
    expect(resultIncoming).toBe(true)
  })
})

describe("ActivityChecker with Cents+Sats wallets", () => {
  it("below threshold", async () => {
    const getVolumeFn = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          outgoingBaseAmount: toSats(0),
          incomingBaseAmount: toSats(10),
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          outgoingBaseAmount: toCents(0),
          incomingBaseAmount: toCents(50),
        }),
      )

    const checker = ActivityChecker({
      dCConverter,
      monthlyVolumeThreshold: toCents(100),
      getVolumeFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet, usdWallet])
    expect(resultIncoming).toBe(false)
  })
  it("above threshold", async () => {
    const getVolumeFn = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          outgoingBaseAmount: toSats(0),
          incomingBaseAmount: toSats(30),
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          outgoingBaseAmount: toCents(0),
          incomingBaseAmount: toCents(90),
        }),
      )

    const checker = ActivityChecker({
      dCConverter,
      monthlyVolumeThreshold: toCents(100),
      getVolumeFn,
    })
    const resultIncoming = await checker.aboveThreshold([btcWallet, usdWallet])
    expect(resultIncoming).toBe(true)
  })
})
