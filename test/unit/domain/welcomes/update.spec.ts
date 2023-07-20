import { NewWelcomeCacheState } from "@domain/welcomes"

describe("initiation", () => {
  describe("updateState", () => {
    it("returns welcomeProfiles", () => {
      const welcomeCache = NewWelcomeCacheState()
      const transactionList = []

      welcomeCache.updateFromNewTransactions(transactionList)

      expect(
        welcomeCache.generateWelcomeProfiles({
          outCircleDepth: 2,
        }),
      ).toEqual([])
    })
  })
})
