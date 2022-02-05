import { toMilliSatsFromBigInt } from "@domain/bitcoin"
import { CachedRouteLookupKeyFactory } from "@domain/routes/key-factory"

describe("cached route key generator", () => {
  it("generated a valid key", () => {
    const paymentHash = "paymentHash" as PaymentHash
    const milliSats = toMilliSatsFromBigInt(100_000n)
    const key = CachedRouteLookupKeyFactory().create({ paymentHash, milliSats })

    const expected = '{"id":"paymentHash","mtokens":"100000"}'
    expect(key).toEqual(expected)
  })
})
