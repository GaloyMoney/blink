import { btc2sat, sat2btc } from "@/domain/bitcoin"
import { elapsedSinceTimestamp } from "@/utils"

describe("utils", () => {
  describe("btc2sat", () => {
    it("converts from BTC to Satoshis", () => {
      expect(btc2sat(0)).toEqual(0)
      expect(btc2sat(1.2)).toEqual(120000000)
      expect(btc2sat(1.1235678)).toEqual(112356780)
      expect(btc2sat(-1.2)).toEqual(-120000000)
      expect(btc2sat(-1.1235678)).toEqual(-112356780)
    })
  })

  describe("sat2btc", () => {
    it("converts from Satoshis to BTC", () => {
      expect(sat2btc(0)).toEqual(0)
      expect(sat2btc(120000000)).toEqual(1.2)
      expect(sat2btc(112356780)).toEqual(1.1235678)
      expect(sat2btc(-120000000)).toEqual(-1.2)
      expect(sat2btc(-112356780)).toEqual(-1.1235678)
    })
  })

  describe("elapsedFromTimestamp", () => {
    it("returns expected number of seconds for elapsed time", () => {
      const timestamp = new Date()
      const expectedElapsed = 20

      const mockNowDate = new Date(timestamp)
      mockNowDate.setSeconds(mockNowDate.getSeconds() + expectedElapsed)
      jest
        .spyOn(global.Date, "now")
        .mockImplementationOnce(() => new Date(mockNowDate).valueOf())

      const elapsed = elapsedSinceTimestamp(timestamp)
      expect(elapsed).toBe(expectedElapsed)
    })
  })
})
