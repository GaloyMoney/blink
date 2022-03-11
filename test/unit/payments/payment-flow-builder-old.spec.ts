import { SettlementMethod, PaymentInitiationMethod } from "@domain/wallets"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { LightningPaymentFlowBuilderOld } from "@domain/payments"
import { ValidationError, WalletCurrency } from "@domain/shared"

// builder.withInvoice.uncheckedAmount?.withSenderWallet.withRoute?.withAmounts

describe("PaymentFlowBuilder", () => {
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

  describe("withSenderWallet", () => {
    it("lazy validates uncheckedAmount", () => {
      const builder = LightningPaymentFlowBuilderOld({ localNodeIds: [] })
      expect(
        builder.withUncheckedAmount(1.1).withSenderWallet(btcWallet).payment(),
      ).toBeInstanceOf(ValidationError)
    })

    it("sets the btcPaymentAmount based on wallet currency", () => {
      const paymentAmount = {
        amount: 1n,
        currency: WalletCurrency.Btc,
      }
      const builder = LightningPaymentFlowBuilderOld({ localNodeIds: [] })
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
      const builder = LightningPaymentFlowBuilderOld({ localNodeIds: [] })
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
      const builder = LightningPaymentFlowBuilderOld({ localNodeIds: [] })
      const payment = builder
        .withSenderWallet(btcWallet)
        .withInvoice(invoiceWithAmount)
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.paymentInitiationMethod).toEqual(PaymentInitiationMethod.Lightning)
    })

    it("sets the btcPaymentAmount", () => {
      const builder = LightningPaymentFlowBuilderOld({ localNodeIds: [] })
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

    it("sets the SettlementMethod and fee for intra ledger", () => {
      const builder = LightningPaymentFlowBuilderOld({
        localNodeIds: [invoiceWithAmount.destination],
      })
      const payment = builder
        .withSenderWallet(btcWallet)
        .withInvoice(invoiceWithAmount)
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.settlementMethod).toEqual(SettlementMethod.IntraLedger)
    })

    it("sets the input amount for invoice with amount", () => {
      const builder = LightningPaymentFlowBuilderOld({ localNodeIds: [] })
      const payment = builder
        .withSenderWallet(btcWallet)
        .withInvoice(invoiceWithAmount)
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.inputAmount).toEqual(invoiceWithAmount.paymentAmount?.amount)
    })

    it("sets the input amount to the unchecked amount", () => {
      const builder = LightningPaymentFlowBuilderOld({ localNodeIds: [] })
      const inputAmount = 100n
      const payment = builder
        .withUncheckedAmount(Number(inputAmount))
        .withSenderWallet(btcWallet)
        .withInvoice(invoiceWithNoAmount)
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.inputAmount).toEqual(inputAmount)
    })
  })

  describe("withRouteResult", () => {
    it("it sets the fee in both currencies", () => {
      const builder = LightningPaymentFlowBuilderOld({ localNodeIds: [] })
      const usdAmount = {
        amount: 100n,
        currency: WalletCurrency.Usd,
      }
      const btcAmount = {
        amount: 1000n,
        currency: WalletCurrency.Btc,
      }
      const payment = builder
        .withUncheckedAmount(Number(usdAmount.amount))
        .withSenderWallet(usdWallet)
        .withInvoice(invoiceWithNoAmount)
        .withBtcAmount(btcAmount)
        .withRouteResult({ pubkey, rawRoute })
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.usdProtocolFee).toEqual({
        amount: 10n,
        currency: WalletCurrency.Usd,
      })
    })
  })

  describe("needsFeeCalculation", () => {
    it("returns false if settlement is IntraLedger", () => {
      const builder = LightningPaymentFlowBuilderOld({
        localNodeIds: [invoiceWithNoAmount.destination],
      })
        .withSenderWallet(btcWallet)
        .withInvoice(invoiceWithNoAmount)

      expect(builder.needsProtocolFee()).toEqual(false)
    })
  })
})
