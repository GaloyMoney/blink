import { btc2sat, sat2btc, isInvoiceAlreadyPaidError } from "@core/utils"

describe("utils.ts", () => {
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

  describe("isInvoiceAlreadyPaidError", () => {
    it("decodes error correctly", () => {
      const error = [
        503,
        "UnexpectedPaymentError",
        {
          err: {
            code: 6,
            details: "invoice is already paid",
            metadata: { internalRepr: {}, options: {} },
          },
        },
      ]
      expect(isInvoiceAlreadyPaidError(error)).toBeTruthy()
    })
  })
})
