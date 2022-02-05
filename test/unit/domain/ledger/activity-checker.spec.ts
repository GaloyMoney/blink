import { toSats } from "@domain/bitcoin"
import { ActivityChecker } from "@domain/ledger/activity-checker"

describe("ActivityChecker", () => {
  it("aboveThreshold returns false below threshold", () => {
    const getVolumeFn = () =>
      Promise.resolve({ outgoingSats: toSats(10n), incomingSats: toSats(10n) })
    const checker = ActivityChecker({
      monthlyVolumeThreshold: toSats(20n),
      getVolumeFn,
    })
    expect(checker.aboveThreshold(["walletId" as WalletId])).resolves.toBe(false)
  })

  it("Returns true if outgoing or incoming sats are above threshold", () => {
    let getVolumeFn = () =>
      Promise.resolve({ outgoingSats: toSats(21n), incomingSats: toSats(10n) })
    let checker = ActivityChecker({
      monthlyVolumeThreshold: toSats(20n),
      getVolumeFn,
    })
    expect(checker.aboveThreshold(["walletId" as WalletId])).resolves.toBe(true)

    getVolumeFn = () =>
      Promise.resolve({ outgoingSats: toSats(10n), incomingSats: toSats(21n) })
    checker = ActivityChecker({
      monthlyVolumeThreshold: toSats(20n),
      getVolumeFn,
    })
    expect(checker.aboveThreshold(["walletId" as WalletId])).resolves.toBe(true)
  })

  it("Sums up consecutive volumes", () => {
    const getVolumeFn = () =>
      Promise.resolve({ outgoingSats: toSats(0n), incomingSats: toSats(10n) })
    const checker = ActivityChecker({
      monthlyVolumeThreshold: toSats(15n),
      getVolumeFn,
    })
    expect(
      checker.aboveThreshold(["walletId" as WalletId, "walletIdC" as WalletId]),
    ).resolves.toBe(true)
  })
})
