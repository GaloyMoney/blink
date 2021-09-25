import { toMilliSats } from "@domain/bitcoin"
import { CachedRouteKeyGenerator } from "@domain/routes/key-generator"

describe("cached route key generator", () => {
  it("generated a valid key", () => {
    const paymentHash = "paymentHash" as PaymentHash
    const milliSats = toMilliSats(100_000)
    const key = CachedRouteKeyGenerator(paymentHash).generate(milliSats)

    const expected = '{"id":"paymentHash","mtokens":"100000"}'
    expect(key).toEqual(expected)
  })
})
