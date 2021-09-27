import { toSats } from "@domain/bitcoin"
import { LnFeeCalculator } from "@domain/bitcoin/lightning"
import { FEECAP, FEEMIN } from "@services/lnd/auth"

describe("LnFeeCalculator", () => {
  let minAmount: Satoshis
  beforeAll(() => {
    minAmount = toSats(FEEMIN / FEECAP)
  })
  it("returns the expected fee for a valid amount", () => {
    const amount = toSats(minAmount + 100)
    const maxFee = LnFeeCalculator().max(amount)
    const expectedMaxFee = toSats(Math.floor(FEECAP * amount))
    expect(maxFee).toEqual(expectedMaxFee)
    expect(expectedMaxFee).toBeGreaterThan(FEEMIN)
  })
  it("returns the minimum fee for a valid small amount", () => {
    const amount = toSats(minAmount - 100)
    const maxFee = LnFeeCalculator().max(amount)
    const expectedMaxFee = toSats(Math.floor(FEECAP * amount))
    expect(maxFee).not.toEqual(expectedMaxFee)
    expect(maxFee).toEqual(FEEMIN)
  })
})
