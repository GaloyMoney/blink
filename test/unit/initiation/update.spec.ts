import { NewInitiationCacheState } from "@domain/initiation"

describe("initiation", () => {
  describe("updateState", () => {
    it("returns initiationProfiles", () => {
      const initiationCache = NewInitiationCacheState()
      const transactionList = []

      initiationCache.updateFromNewTransactions(transactionList)

      expect(initiationCache.initiationProfiles()).toEqual([])
    })
  })
})
