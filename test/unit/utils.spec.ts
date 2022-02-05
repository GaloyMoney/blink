import { btc2sat, sat2btc } from "@domain/bitcoin"

describe("utils.ts", () => {
  describe("btc2sat", () => {
    it("converts from BTC to Satoshis", () => {
      expect(btc2sat(0)).toEqual(0n)
      expect(btc2sat(1.2)).toEqual(120_000_000n)
      expect(btc2sat(1.1235678)).toEqual(112_356_780n)
      expect(btc2sat(-1.2)).toEqual(-120_000_000n)
      expect(btc2sat(-1.1235678)).toEqual(-112_356_780n)
    })
  })

  describe("sat2btc", () => {
    it("converts from Satoshis to BTC", () => {
      expect(sat2btc(0n as Satoshis)).toEqual(0)
      expect(sat2btc(120000000n as Satoshis)).toEqual(1.2)
      expect(sat2btc(112356780n as Satoshis)).toEqual(1.1235678)
      expect(sat2btc(-120000000n as Satoshis)).toEqual(-1.2)
      expect(sat2btc(-112356780n as Satoshis)).toEqual(-1.1235678)
    })
  })
})
