import { roundToBigInt } from "@/domain/shared/safe"

describe("safe", () => {
  describe("roundToBigInt", () => {
    const amounts = [
      { amount: 200.99999999999997, expected: 201n },
      { amount: 7823.999999999999, expected: 7824n },
      { amount: 501.99999999999994, expected: 502n },
      { amount: 1034504.0000000001, expected: 1034504n },
      { amount: 2001.0000000000002, expected: 2001n },
    ]
    test.each(amounts)(
      "amount $amount is trunc correctly to $expected",
      ({ amount, expected }) => {
        const result = roundToBigInt(amount)
        expect(result).toEqual(expected)
      },
    )
  })
})
