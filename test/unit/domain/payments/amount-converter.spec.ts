import { decodeInvoice } from "@domain/bitcoin/lightning"
import { AmountConverter, LightningPaymentFlowBuilderOld } from "@domain/payments"
import { WalletCurrency } from "@domain/shared"

import { NewDealerPriceService } from "test/mocks/dealer-price"

describe("AmountConverter", () => {
  describe("addAmountsForFutureBuy", () => {
    describe("with a USD wallet", () => {
      const paymentRequestWithNoAmount =
        "lnbc1p3zn402pp54skf32qeal5jnfm73u5e3d9h5448l4yutszy0kr9l56vdsy8jefsdqqcqzpuxqyz5vqsp5c6z7a4lrey4ejvhx5q4l83jm9fhy34dsqgxnceem4dgz6fmh456s9qyyssqkxkg6ke6nt39dusdhpansu8j0r5f7gadwcampnw2g8ap0fccteer7hzjc8tgat9m5wxd98nxjxhwx0ha6g95v9edmgd30f0m8kujslgpxtzt6w" as EncodedPaymentRequest
      const invoiceWithNoAmount = decodeInvoice(paymentRequestWithNoAmount) as LnInvoice
      const usdWallet = {
        id: "walletId" as WalletId,
        currency: WalletCurrency.Usd,
      }
      const usdAmount = {
        amount: 100n,
        currency: WalletCurrency.Usd,
      }
      const btcAmount = {
        amount: 2000n - 8n,
        currency: WalletCurrency.Btc,
      }

      it("adds the missing btc amount", async () => {
        const builder = LightningPaymentFlowBuilderOld({ localNodeIds: [] })
          .withSenderWallet(usdWallet)
          .withInvoice(invoiceWithNoAmount)
          .withUncheckedAmount(Number(usdAmount.amount))

        const builderWithAmounts = await AmountConverter({
          dealerFns: NewDealerPriceService(),
        }).addAmountsForFutureBuy(builder)
        if (builderWithAmounts instanceof Error) throw builderWithAmounts
        expect(builderWithAmounts.btcPaymentAmount()).toEqual(btcAmount)
      })
    })
  })
})
