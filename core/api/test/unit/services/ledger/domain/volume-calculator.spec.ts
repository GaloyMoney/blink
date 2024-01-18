import { WalletCurrency } from "@/domain/shared"
import { VolumeCalculator } from "@/services/ledger/facade"

describe("VolumeCalculator", () => {
  const volume = VolumeCalculator({
    outgoingBaseAmount: { amount: 2000n, currency: WalletCurrency.Btc },
    incomingBaseAmount: { amount: 1000n, currency: WalletCurrency.Btc },
  })

  it("calculates 'in'", () => {
    const expected = { amount: 1000n, currency: WalletCurrency.Btc }
    expect(volume.in()).toStrictEqual(expected)
  })

  it("calculates 'out'", () => {
    const expected = { amount: 2000n, currency: WalletCurrency.Btc }
    expect(volume.out()).toStrictEqual(expected)
  })

  it("calculates 'netIn'", () => {
    const expected = { amount: -1000n, currency: WalletCurrency.Btc }
    expect(volume.netIn()).toStrictEqual(expected)
  })

  it("calculates 'netOut'", () => {
    const expected = { amount: 1000n, currency: WalletCurrency.Btc }
    expect(volume.netOut()).toStrictEqual(expected)
  })

  it("calculates 'absolute'", () => {
    const expected = { amount: 3000n, currency: WalletCurrency.Btc }
    expect(volume.absolute()).toStrictEqual(expected)
  })
})
