import { toSats, FEECAP_PERCENT, FEEMIN } from "@domain/bitcoin"
import { LnFeeCalculator } from "@domain/bitcoin/lightning"

describe("LnFeeCalculator", () => {
  let minAmount: Satoshis
  beforeAll(() => {
    minAmount = toSats(FEEMIN / FEECAP_PERCENT)
  })
  it("returns the expected fee for a valid amount", () => {
    const amount = toSats(minAmount + 100)
    const maxFee = LnFeeCalculator().max(amount)
    const expectedMaxFee = toSats(Math.floor(FEECAP_PERCENT * amount))
    expect(maxFee).toEqual(expectedMaxFee)
    expect(expectedMaxFee).toBeGreaterThan(FEEMIN)
  })
  it("returns the minimum fee for a valid small amount", () => {
    const amount = toSats(minAmount - 100)
    const maxFee = LnFeeCalculator().max(amount)
    const expectedMaxFee = toSats(Math.floor(FEECAP_PERCENT * amount))
    expect(maxFee).toEqual(expectedMaxFee)
    // FIXME: condition below is when the FEEMIN is taking into consideration
    // expect(maxFee).not.toEqual(expectedMaxFee)
    // expect(maxFee).toEqual(FEEMIN)
  })
  it("returns inverse properly", () => {
    const amount = toSats(minAmount + 100)
    const maxFee = LnFeeCalculator().max(amount)
    const amountRevert = LnFeeCalculator().inverseMax(maxFee)
    expect(amountRevert).toEqual(amount)
  })
})
