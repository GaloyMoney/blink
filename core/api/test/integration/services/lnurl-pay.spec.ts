import { decodeInvoice } from "@/domain/bitcoin/lightning"
import { ErrorFetchingLnurlInvoice } from "@/domain/bitcoin/lnurl/errors"
import { LnurlPayService } from "@/services/lnurl-pay"
import { createRandomUserAndWallets } from "test/helpers"
import { setUsername, usernameAvailable } from "@/app/accounts"
import { checkedToUsername } from "@/domain/accounts"

const usernameForLnAddress = checkedToUsername("lnurl_test_user")
const lnurlForUsername =
  "lnurl1dp68gup69uhkcmmrv9kxsmmnwsarxvpsxghjuam9d3kz66mwdamkutmvde6hymrs9akxuatjd30hgetnw30h2um9wg3wjc63" // http://localhost:3002/.well-known/lnurlp/lnurl_test_user
if (usernameForLnAddress instanceof Error) {
  throw usernameForLnAddress
}

beforeAll(async () => {
  const isUsernameAvailable = await usernameAvailable(usernameForLnAddress)
  if (isUsernameAvailable instanceof Error) {
    throw isUsernameAvailable
  }
  if (isUsernameAvailable) {
    const newUser = await createRandomUserAndWallets()
    const setUsernameRes = await setUsername({
      accountId: newUser.btcWalletDescriptor.accountId,
      username: usernameForLnAddress,
    })

    if (setUsernameRes instanceof Error) {
      throw setUsernameRes
    }
  }
})

describe("LnurlPayService", () => {
  const lnurlPayService = LnurlPayService()

  describe("fetchInvoiceFromLnAddressOrLnurl", () => {
    it("fetches an invoice from an lnurl", async () => {
      const invoice = await lnurlPayService.fetchInvoiceFromLnAddressOrLnurl({
        amount: {
          amount: BigInt(1000),
          currency: "BTC",
        } as BtcPaymentAmount,
        lnAddressOrLnurl: lnurlForUsername,
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
