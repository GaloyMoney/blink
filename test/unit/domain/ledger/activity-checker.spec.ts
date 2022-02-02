import { toSats } from "@domain/bitcoin"
import { ActivityChecker } from "@domain/ledger/activity-checker"

describe("ActivityChecker", () => {
  it("aboveThreshold returns false below threshold", () => {
    const getVolumeFn = () =>
      Promise.resolve({ outgoingSats: toSats(10), incomingSats: toSats(10) })
    const checker = ActivityChecker({
      monthlyVolumeThreshold: toSats(20),
      getVolumeFn,
    })
    expect(checker.aboveThreshold(["walletId" as WalletId])).resolves.toBe(false)
  })

  it("Returns true if outgoing or incoming sats are above threshold", () => {
    let getVolumeFn = () =>
      Promise.resolve({ outgoingSats: toSats(21), incomingSats: toSats(10) })
    let checker = ActivityChecker({
      monthlyVolumeThreshold: toSats(20),
      getVolumeFn,
    })
    expect(checker.aboveThreshold(["walletId" as WalletId])).resolves.toBe(true)

    getVolumeFn = () =>
      Promise.resolve({ outgoingSats: toSats(10), incomingSats: toSats(21) })
    checker = ActivityChecker({
      monthlyVolumeThreshold: toSats(20),
      getVolumeFn,
    })
    expect(checker.aboveThreshold(["walletId" as WalletId])).resolves.toBe(true)
  })

  it("Sums up consecutive volumes", () => {
    const getVolumeFn = () =>
      Promise.resolve({ outgoingSats: toSats(0), incomingSats: toSats(10) })
    const checker = ActivityChecker({
      monthlyVolumeThreshold: toSats(15),
      getVolumeFn,
    })
    expect(
      checker.aboveThreshold(["walletId" as WalletId, "walletIdC" as WalletId]),
    ).resolves.toBe(true)
  })
})
