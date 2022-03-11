import { SettlementMethod, PaymentInitiationMethod } from "@domain/wallets"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { LightningPaymentFlowBuilder } from "@domain/payments"
import { ValidationError, WalletCurrency } from "@domain/shared"

// builder.withInvoice.withSenderWallet.withRoute?.withAmounts

describe("LightningPaymentFlowBuilder", () => {
  const paymentRequestWithAmount =
    "lnbc20u1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfppqw508d6qejxtdg4y5r3zarvary0c5xw7kxqrrsssp5m6kmam774klwlh4dhmhaatd7al02m0h0m6kmam774klwlh4dhmhs9qypqqqcqpf3cwux5979a8j28d4ydwahx00saa68wq3az7v9jdgzkghtxnkf3z5t7q5suyq2dl9tqwsap8j0wptc82cpyvey9gf6zyylzrm60qtcqsq7egtsq" as EncodedPaymentRequest
  const invoiceWithAmount = decodeInvoice(paymentRequestWithAmount) as LnInvoice
  const paymentRequestWithNoAmount =
    "lnbc1p3zn402pp54skf32qeal5jnfm73u5e3d9h5448l4yutszy0kr9l56vdsy8jefsdqqcqzpuxqyz5vqsp5c6z7a4lrey4ejvhx5q4l83jm9fhy34dsqgxnceem4dgz6fmh456s9qyyssqkxkg6ke6nt39dusdhpansu8j0r5f7gadwcampnw2g8ap0fccteer7hzjc8tgat9m5wxd98nxjxhwx0ha6g95v9edmgd30f0m8kujslgpxtzt6w" as EncodedPaymentRequest
  const invoiceWithNoAmount = decodeInvoice(paymentRequestWithNoAmount) as LnInvoice
  const btcWallet = {
    id: "walletId" as WalletId,
    currency: WalletCurrency.Btc,
  }
  const usdWallet = {
    id: "walletId" as WalletId,
    currency: WalletCurrency.Usd,
  }
  const pubkey = "pubkey" as Pubkey
  const rawRoute = { fee: 100 } as RawRoute
  const midPriceRatio = 1n
  const dealerPriceRatio = 2n
  const usdFromBtcMidPriceFn = async (amount: BtcPaymentAmount) => {
    return Promise.resolve({
      amount: amount.amount * midPriceRatio,
      currency: WalletCurrency.Usd,
    })
  }
  const usdFromBtc = async (amount: BtcPaymentAmount) => {
    return Promise.resolve({
      amount: amount.amount * dealerPriceRatio,
      currency: WalletCurrency.Usd,
    })
  }
  const btcFromUsd = async (amount: UsdPaymentAmount) => {
    return Promise.resolve({
      amount: amount.amount / dealerPriceRatio,
      currency: WalletCurrency.Btc,
    })
  }

  describe("invoice with amount", () => {
    describe("with btc wallet", () => {
      describe("not intraledger", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [],
          usdFromBtcMidPriceFn,
        })
          .withInvoice(invoiceWithAmount)
          .withSenderWallet(btcWallet)
          .withoutRecipientWallet()
          .withConversion({
            usdFromBtc,
            btcFromUsd,
          })
          .withRoute({ pubkey, rawRoute })
        if (payment instanceof Error) throw payment

        expect(payment.settlementMethod).toEqual(SettlementMethod.Lightning)
      })
    })
  })
})
