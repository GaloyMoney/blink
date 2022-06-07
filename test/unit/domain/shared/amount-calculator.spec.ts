import { AmountCalculator, WalletCurrency } from "@domain/shared"

describe("AmountCalculator", () => {
  const calc = AmountCalculator()

  describe("adds", () => {
    const currency = WalletCurrency.Btc
    const a = { amount: 200n, currency }
    const b = { amount: 100n, currency }

    it("adds two payment amounts", () => {
      const res = calc.add(a, b)
      expect(res).toStrictEqual({ amount: 300n, currency })
    })

    // TODO: implement
    it.skip("fails with two payment amounts of mismatched currencies", () => {
      const res1 = calc.add(a, { amount: 200n, currency: WalletCurrency.Usd })
      expect(res1).toBeInstanceOf(Error)

      const res2 = calc.add({ amount: 100n, currency: WalletCurrency.Usd }, b)
      expect(res2).toBeInstanceOf(Error)
    })
  })

  describe("subs", () => {
    const currency = WalletCurrency.Btc
    const a = { amount: 200n, currency }
    const b = { amount: 100n, currency }

    it("sub two payment amounts", () => {
      const res = calc.sub(a, b)
      expect(res).toStrictEqual({ amount: 100n, currency })
    })

    // TODO: implement
    it.skip("fails with two payment amounts of mismatched currencies", () => {
      const res1 = calc.sub(a, { amount: 200n, currency: WalletCurrency.Usd })
      expect(res1).toBeInstanceOf(Error)

      const res2 = calc.sub({ amount: 100n, currency: WalletCurrency.Usd }, b)
      expect(res2).toBeInstanceOf(Error)
    })

    // TODO: implement
    it.skip("fails with if 1st value is smaller than 2nd one", () => {
      const res = calc.sub(b, a)
      expect(res).toBeInstanceOf(Error)
    })
  })

  describe("divides", () => {
    const currency = WalletCurrency.Btc

    const pivot = 200n
    const divisor = 100n
    const divisorBound = 50n
    const quotient = 2n

    describe("by rounding normally", () => {
      it("no rounding if remainder is 0", () => {
        const result = calc.divRound({ amount: pivot, currency }, divisor)
        expect(result.amount).toEqual(quotient)
        expect(result.currency).toBe(currency)
      })

      it("rounds down if remainder is just above pivot", () => {
        const result = calc.divRound({ amount: pivot + 1n, currency }, divisor)
        expect(result.amount).toEqual(quotient)
        expect(result.currency).toBe(currency)
      })

      it("rounds up if remainder is just below pivot", () => {
        const result = calc.divRound({ amount: pivot - 1n, currency }, divisor)
        expect(result.amount).toEqual(quotient)
        expect(result.currency).toBe(currency)
      })

      it("rounds down if remainder is just below half of the divisor", () => {
        const result = calc.divRound(
          { amount: pivot + (divisorBound - 1n), currency },
          divisor,
        )
        expect(result.amount).toEqual(quotient)
        expect(result.currency).toBe(currency)
      })

      it("rounds down if remainder is half of the divisor", () => {
        const result = calc.divRound({ amount: pivot + divisorBound, currency }, divisor)
        expect(result.amount).toEqual(quotient)
        expect(result.currency).toBe(currency)
      })

      it("rounds up if remainder is just above half of the divisor", () => {
        const result = calc.divRound(
          { amount: pivot + (divisorBound + 1n), currency },
          divisor,
        )
        expect(result.amount).toEqual(quotient + 1n)
        expect(result.currency).toBe(currency)
      })
    })

    describe("by rounding to floor", () => {
      it("no rounding if remainder is 0", () => {
        const result = calc.divFloor({ amount: pivot, currency }, divisor)
        expect(result.amount).toEqual(quotient)
        expect(result.currency).toBe(currency)
      })

      it("rounds down if remainder is just above pivot", () => {
        const result = calc.divFloor({ amount: pivot + 1n, currency }, divisor)
        expect(result.amount).toEqual(quotient)
        expect(result.currency).toBe(currency)
      })

      it("rounds down if remainder is just below pivot", () => {
        const result = calc.divFloor({ amount: pivot - 1n, currency }, divisor)
        expect(result.amount).toEqual(quotient - 1n)
        expect(result.currency).toBe(currency)
      })

      it("rounds down if remainder is just below half of the divisor", () => {
        const result = calc.divFloor(
          { amount: pivot + (divisorBound - 1n), currency },
          divisor,
        )
        expect(result.amount).toEqual(quotient)
        expect(result.currency).toBe(currency)
      })

      it("rounds down if remainder is half of the divisor", () => {
        const result = calc.divFloor({ amount: pivot + divisorBound, currency }, divisor)
        expect(result.amount).toEqual(quotient)
        expect(result.currency).toBe(currency)
      })

      it("rounds down if remainder is just above half of the divisor", () => {
        const result = calc.divFloor(
          { amount: pivot + (divisorBound + 1n), currency },
          divisor,
        )
        expect(result.amount).toEqual(quotient)
        expect(result.currency).toBe(currency)
      })
    })
  })
})
