import { toMilliSatsFromNumber } from "@domain/bitcoin"
import { toCents } from "@domain/fiat"
import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"

describe("cached route key generator", () => {
  it("generated a valid key for msats", () => {
    const paymentHash = "paymentHash" as PaymentHash
    const milliSats = toMilliSatsFromNumber(100_000)
    const key = CachedRouteLookupKeyFactory().createFromMilliSats({
      paymentHash,
      milliSats,
    })

    const expected = '{"id":"paymentHash","mtokens":"100000"}'
    expect(key).toEqual(expected)
  })
  it("generated a valid key for cents", () => {
    const paymentHash = "paymentHash" as PaymentHash
    const cents = toCents(1_000)
    const key = CachedRouteLookupKeyFactory().createFromCents({
      paymentHash,
      cents,
    })

    const expected = '{"id":"paymentHash","cents":"1000"}'
    expect(key).toEqual(expected)
  })
})
