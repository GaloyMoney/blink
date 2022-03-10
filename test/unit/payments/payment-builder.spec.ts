import { SettlementMethod, PaymentInitiationMethod } from "@domain/wallets"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { LightningPaymentBuilder } from "@domain/payments"
import { ValidationError, WalletCurrency } from "@domain/shared"

describe("PaymentBuilder", () => {
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
  describe("withSenderWallet", () => {
    it("lazy validates uncheckedAmount", () => {
      const builder = LightningPaymentBuilder({ localNodeIds: [] })
      expect(
        builder.withUncheckedAmount(1.1).withSenderWallet(btcWallet).payment(),
      ).toBeInstanceOf(ValidationError)
    })

    it("sets the btcPaymentAmount based on wallet currency", () => {
      const paymentAmount = {
        amount: 1n,
        currency: WalletCurrency.Btc,
      }
      const builder = LightningPaymentBuilder({ localNodeIds: [] })
      const payment = builder
        .withUncheckedAmount(Number(paymentAmount.amount))
        .withSenderWallet(btcWallet)
        .withInvoice(invoiceWithNoAmount)
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.btcPaymentAmount).toEqual(paymentAmount)
    })

    it("sets the usdPaymentAmount based on wallet currency", () => {
      const paymentAmount = {
        amount: 1n,
        currency: WalletCurrency.Usd,
      }
      const builder = LightningPaymentBuilder({ localNodeIds: [] })
      const payment = builder
        .withSenderWallet(usdWallet)
        .withInvoice(invoiceWithNoAmount)
        .withUncheckedAmount(Number(paymentAmount.amount))
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.usdPaymentAmount).toEqual(paymentAmount)
    })
  })
  describe("withInvoice", () => {
    it("sets the PaymentInitiationMethod", () => {
      const builder = LightningPaymentBuilder({ localNodeIds: [] })
      const payment = builder
        .withSenderWallet(btcWallet)
        .withInvoice(invoiceWithAmount)
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.paymentInitiationMethod).toEqual(PaymentInitiationMethod.Lightning)
    })

    it("sets the btcPaymentAmount", () => {
      const builder = LightningPaymentBuilder({ localNodeIds: [] })
      const payment = builder
        .withSenderWallet(btcWallet)
        .withInvoice(invoiceWithAmount)
        .payment()
      if (payment instanceof Error) throw payment
      const expectedAmount = {
        amount: 2000n,
        currency: WalletCurrency.Btc,
      }

      expect(payment.btcPaymentAmount).toEqual(expectedAmount)
    })

    it("sets the SettlementMethod based on local node ids", () => {
      const builder = LightningPaymentBuilder({
        localNodeIds: [invoiceWithAmount.destination],
      })
      const payment = builder
        .withSenderWallet(btcWallet)
        .withInvoice(invoiceWithAmount)
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.settlementMethod).toEqual(SettlementMethod.IntraLedger)
    })
  })
})
