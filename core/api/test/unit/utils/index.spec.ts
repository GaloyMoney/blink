import {
  btc2sat,
  sat2btc,
  toSats,
  toMilliSatsFromNumber,
  toMilliSatsFromString,
  checkedToCurrencyBaseAmount,
  checkedToSats,
  isSha256Hash,
} from "@/domain/bitcoin"
import {
  InvalidCurrencyBaseAmountError,
  InvalidSatoshiAmountError,
} from "@/domain/errors"
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

  describe("toSats", () => {
    it("toSats converts number or bigint to satoshis", () => {
      expect(toSats(12345)).toBe(12345)
      expect(toSats(BigInt(12345))).toBe(12345)
    })
  })

  describe("toMilliSatsFromNumber", () => {
    it("toMilliSatsFromNumber converts number to millisatoshis", () => {
      expect(toMilliSatsFromNumber(12345)).toBe(12345)
    })
  })

  describe("toMilliSatsFromString", () => {
    it("toMilliSatsFromString converts string to millisatoshis", () => {
      expect(toMilliSatsFromString("12345")).toBe(12345)
      expect(toMilliSatsFromString("0")).toBe(0)
    })
  })

  describe("checkedToCurrencyBaseAmount", () => {
    it("checkedToCurrencyBaseAmount validates currency base amount", () => {
      expect(checkedToCurrencyBaseAmount(12345)).toBe(12345)
      expect(checkedToCurrencyBaseAmount(0)).toBeInstanceOf(
        InvalidCurrencyBaseAmountError,
      )
    })
  })

  describe("checkedToSats", () => {
    it("checkedToSats validates satoshi amount", () => {
      expect(checkedToSats(12345)).toBe(12345)
      expect(checkedToSats(0)).toBeInstanceOf(InvalidSatoshiAmountError)
    })
  })

  describe("isSha256Hash", () => {
    it("isSha256Hash validates SHA-256 hash format", () => {
      expect(
        isSha256Hash("a3c45e9f8b7d0f4c5a1234567890abcdef1234567890abcdef1234567890abcd"),
      ).toBe(true)
      expect(isSha256Hash("not-a-hash")).toBe(false)
      expect(isSha256Hash("123")).toBe(false)
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
