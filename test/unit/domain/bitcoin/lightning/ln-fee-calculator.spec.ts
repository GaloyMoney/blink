import { toSats, FEECAP_PERCENT, FEEMIN } from "@domain/bitcoin"
import { LnFeeCalculator } from "@domain/bitcoin/lightning"

describe("LnFeeCalculator", () => {
  let minAmount: number
  beforeAll(() => {
    minAmount = Number(FEEMIN) / FEECAP_PERCENT
  })
  it("returns the expected fee for a valid amount", () => {
    const amount = minAmount + 100
    const expectedMaxFee = toSats(BigInt(Math.floor(FEECAP_PERCENT * amount)))
    const maxFee = LnFeeCalculator().max(toSats(BigInt(amount)))
    expect(maxFee).toEqual(expectedMaxFee)
    expect(expectedMaxFee).toBeGreaterThan(FEEMIN)
  })
  it("returns the minimum fee for a valid small amount", () => {
    const amount = minAmount - 100
    const expectedMaxFee = toSats(BigInt(Math.floor(FEECAP_PERCENT * amount)))
    const maxFee = LnFeeCalculator().max(toSats(BigInt(amount)))
    expect(maxFee).not.toEqual(expectedMaxFee)
    expect(maxFee).toEqual(FEEMIN)
  })
})
