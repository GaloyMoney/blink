import { ErrorFetchingLnurlInvoice } from "@/domain/bitcoin/lnurl/errors"
import { LnurlPayService } from "@/services/lnurl-pay"

describe("LnurlPayService", () => {
  const lnurlPayService = LnurlPayService()

  describe("fetchInvoiceFromLnAddressOrLnurl", () => {
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
