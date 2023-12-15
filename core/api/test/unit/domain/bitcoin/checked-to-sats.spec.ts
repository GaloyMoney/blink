import { checkedToSats } from "@/domain/bitcoin"
import { MAX_SATS } from "@/domain/shared"

describe("sats-amount-check", () => {
  it("Positive amount value for satoshis passes", () => {
    const sats = checkedToSats(100)
    expect(sats).toEqual(100)
  })

  it("Zero amount value for satoshis fails", () => {
    const sats = checkedToSats(0)
    expect(sats).toBeInstanceOf(Error)
  })

  it("Negative amount value for satoshis fails", () => {
    const sats = checkedToSats(-100)
    expect(sats).toBeInstanceOf(Error)
  })

  it("Large amount value for satoshis fails", () => {
    const sats = checkedToSats(Number(MAX_SATS.amount + 1n))
    expect(sats).toBeInstanceOf(Error)
  })
})
