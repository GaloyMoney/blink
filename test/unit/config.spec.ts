import { getUserLimits, getTransactionLimits, getLimitConstants } from "@config/app"

const testLimitsConfig = {
  oldEnoughForWithdrawal: 172800000,
  withdrawal: {
    level: {
      1: 2000000,
      2: 100000000,
    },
  },
  onUs: {
    level: {
      1: 5000000,
      2: 100000000,
    },
  },
}
const testLimitConstants = getLimitConstants(testLimitsConfig)

describe("config.ts", () => {
  describe("generates expected constants from a limits config object", () => {
    it("generates expected limitConstants", () => {
      expect(testLimitConstants.oldEnoughForWithdrawalHours).toEqual(48)
      expect(testLimitConstants.oldEnoughForWithdrawalMicroseconds).toEqual(172800000)
    })

    it("selects user limits for level 1", () => {
      const userLimits = getUserLimits({ level: 1, limitsConfig: testLimitsConfig })
      expect(userLimits.onUsLimit).toEqual(5000000)
      expect(userLimits.withdrawalLimit).toEqual(2000000)
    })

    it("selects user limits for level 2", () => {
      const userLimits = getUserLimits({ level: 2, limitsConfig: testLimitsConfig })
      expect(userLimits.onUsLimit).toEqual(100000000)
      expect(userLimits.withdrawalLimit).toEqual(100000000)
    })

    it("selects transaction limits for level 1", () => {
      const transactionLimits = getTransactionLimits({
        level: 1,
        limitsConfig: testLimitsConfig,
      })
      expect(transactionLimits.oldEnoughForWithdrawalLimit).toEqual(172800000)
      expect(transactionLimits.oldEnoughForWithdrawalLimitHours).toEqual(48)
      expect(transactionLimits.onUsLimit).toEqual(5000000)
      expect(transactionLimits.withdrawalLimit).toEqual(2000000)
    })

    it("selects transaction limits for level 2", () => {
      const transactionLimits = getTransactionLimits({
        level: 2,
        limitsConfig: testLimitsConfig,
      })
      expect(transactionLimits.oldEnoughForWithdrawalLimit).toEqual(172800000)
      expect(transactionLimits.oldEnoughForWithdrawalLimitHours).toEqual(48)
      expect(transactionLimits.onUsLimit).toEqual(100000000)
      expect(transactionLimits.withdrawalLimit).toEqual(100000000)
    })
  })
})
