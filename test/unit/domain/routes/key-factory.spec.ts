import { toMilliSatsFromNumber } from "@domain/bitcoin"
import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"

describe("cached route key generator", () => {
  it("generated a valid key", () => {
    const paymentHash = "paymentHash" as PaymentHash
    const milliSats = toMilliSatsFromNumber(100_000)
    const key = CachedRouteLookupKeyFactory().create({ paymentHash, milliSats })

    const expected = '{"id":"paymentHash","mtokens":"100000"}'
    expect(key).toEqual(expected)
  })
})
