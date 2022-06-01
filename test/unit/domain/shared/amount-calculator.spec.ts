import { AmountCalculator, WalletCurrency } from "@domain/shared"

describe("AmountCalculator", () => {
  const calc = AmountCalculator()
  describe("divides", () => {
    const currency = WalletCurrency.Btc

    const pivot = 200n
    const divisor = 100n
    const divisorBound = 50n
    const quotient = 2n

    it("no rounding if remainder is 0", () => {
      const result = calc.div({ amount: pivot, currency }, divisor)
      expect(result.amount).toEqual(quotient)
      expect(result.currency).toBe(currency)
    })

    it("rounds down if remainder is just above pivot", () => {
      const result = calc.div({ amount: pivot + 1n, currency }, divisor)
      expect(result.amount).toEqual(quotient)
      expect(result.currency).toBe(currency)
    })

    it("rounds up if remainder is just below pivot", () => {
      const result = calc.div({ amount: pivot - 1n, currency }, divisor)
      expect(result.amount).toEqual(quotient)
      expect(result.currency).toBe(currency)
    })

    it("rounds down if remainder is just below half of the divisor", () => {
      const result = calc.div({ amount: pivot + (divisorBound - 1n), currency }, divisor)
      expect(result.amount).toEqual(quotient)
      expect(result.currency).toBe(currency)
    })

    it("rounds down if remainder is half of the divisor", () => {
      const result = calc.div({ amount: pivot + divisorBound, currency }, divisor)
      expect(result.amount).toEqual(quotient)
      expect(result.currency).toBe(currency)
    })

    it("rounds up if remainder is just above half of the divisor", () => {
      const result = calc.div({ amount: pivot + (divisorBound + 1n), currency }, divisor)
      expect(result.amount).toEqual(quotient + 1n)
      expect(result.currency).toBe(currency)
    })
  })
})
