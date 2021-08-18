import { checkedToSats } from "@domain/bitcoin"

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
})
