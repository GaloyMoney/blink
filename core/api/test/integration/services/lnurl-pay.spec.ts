import { decodeInvoice } from "@/domain/bitcoin/lightning"
import { ErrorFetchingLnurlInvoice } from "@/domain/bitcoin/lnurl/errors"
import { LnurlPayService } from "@/services/lnurl-pay"

describe("LnurlPayService", () => {
  const lnurlPayService = LnurlPayService()

  describe("fetchInvoiceFromLnAddressOrLnurl", () => {
    it("fetches an invoice from an lnurl", async () => {
      const invoice = await lnurlPayService.fetchInvoiceFromLnAddressOrLnurl({
        amount: {
          amount: BigInt(1000),
          currency: "BTC",
        } as BtcPaymentAmount,
        lnAddressOrLnurl:
          "lnurl1dp68gurn8ghj7urp0yhxymrfde4juumk9uh8wetvdskkkmn0wahz7mrww4excup0w3jhxaqlq07tq", // https://pay.blink.sv/.well-known/lnurlp/test
      })

      if (invoice instanceof Error) {
        throw invoice
      }

      const decodedInvoice = await decodeInvoice(invoice)

      if (decodedInvoice instanceof Error) {
        throw decodedInvoice
      }

      expect(decodedInvoice.amount).toEqual(1000)
    })

    it("fetches an invoice from an ln address", async () => {
      const invoice = await lnurlPayService.fetchInvoiceFromLnAddressOrLnurl({
        amount: {
          amount: BigInt(1000),
          currency: "BTC",
        } as BtcPaymentAmount,
        lnAddressOrLnurl: "test@blink.sv",
      })

      if (invoice instanceof Error) {
        throw invoice
      }

      const decodedInvoice = await decodeInvoice(invoice)

      if (decodedInvoice instanceof Error) {
        throw decodedInvoice
      }

      expect(decodedInvoice.amount).toEqual(1000)
    })

    it("returns an error if the lnurl is invalid", async () => {
      const invoice = await lnurlPayService.fetchInvoiceFromLnAddressOrLnurl({
        amount: {
          amount: BigInt(1000),
          currency: "BTC",
        } as BtcPaymentAmount,
        lnAddressOrLnurl: "invalid",
      })

      expect(invoice).toBeInstanceOf(ErrorFetchingLnurlInvoice)
    })
  })
})
