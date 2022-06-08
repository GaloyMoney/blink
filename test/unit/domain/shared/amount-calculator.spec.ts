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

    const describeCases = [
      {
        type: "normal",
        div: calc.divRound,
        up: "up",
        down: "down",
      },
      {
        type: "floor",
        div: calc.divFloor,
        up: "down",
        down: "down",
      },
      {
        type: "ceil",
        div: calc.divCeil,
        up: "up",
        down: "up",
      },
    ]
    const itCases = ({ up, down }) => [
      {
        title: `no rounding if remainder is 0`,
        amount: pivot,
        result: {
          normal: quotient,
          floor: quotient,
          ceil: quotient,
        },
      },
      {
        title: `rounds ${down} if remainder is just above pivot`,
        amount: pivot + 1n,
        result: {
          normal: quotient,
          floor: quotient,
          ceil: quotient + 1n,
        },
      },
      {
        title: `rounds ${up} if remainder is just below pivot`,
        amount: pivot - 1n,
        result: {
          normal: quotient,
          floor: quotient - 1n,
          ceil: quotient,
        },
      },
      {
        title: `rounds ${down} if remainder is just below half of the divisor`,
        amount: pivot + (divisorBound - 1n),
        result: {
          normal: quotient,
          floor: quotient,
          ceil: quotient + 1n,
        },
      },
      {
        title: `rounds ${up} if remainder is just above half of the divisor`,
        amount: pivot + (divisorBound + 1n),
        result: {
          normal: quotient + 1n,
          floor: quotient,
          ceil: quotient + 1n,
        },
      },
      {
        title: `rounds ${down} if remainder is half of the divisor`,
        amount: pivot + divisorBound,
        result: {
          normal: quotient,
          floor: quotient,
          ceil: quotient + 1n,
        },
      },
    ]

    for (const describeGroup of describeCases) {
      describe(`by rounding to ${describeGroup.type}`, () => {
        const { up, down } = describeGroup
        for (const testCase of itCases({ up, down })) {
          const { title, amount } = testCase
          const expectedResult = testCase.result[describeGroup.type]

          it(title, () => {
            const result = describeGroup.div({ amount, currency }, divisor)
            expect(result.amount).toEqual(expectedResult)
            expect(result.currency).toBe(currency)
          })
        }
      })
    }
  })
})
