import { getAccountLimits } from "@config"
import { toCents } from "@domain/fiat"

const accountLimits = {
  withdrawal: {
    level: {
      1: toCents(2_000_000),
      2: toCents(100_000_000),
    },
  },
  intraLedger: {
    level: {
      1: toCents(5_000_000),
      2: toCents(100_000_000),
    },
  },
}

describe("config.ts", () => {
  describe("generates expected constants from a limits config object", () => {
    it("selects user limits for level 1", () => {
      const userLimits = getAccountLimits({ level: 1, accountLimits })
      expect(userLimits.intraLedgerLimit).toEqual(5_000_000)
      expect(userLimits.withdrawalLimit).toEqual(2_000_000)
    })

    it("selects user limits for level 2", () => {
      const userLimits = getAccountLimits({ level: 2, accountLimits })
      expect(userLimits.intraLedgerLimit).toEqual(100_000_000)
      expect(userLimits.withdrawalLimit).toEqual(100_000_000)
    })
  })
})
