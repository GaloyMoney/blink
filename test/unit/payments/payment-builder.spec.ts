import { SettlementMethod, PaymentInitiationMethod } from "@domain/wallets"
import { PaymentBuilder } from "@domain/payments"
import { ValidationError, WalletCurrency } from "@domain/shared"

describe("PaymentBuilder", () => {
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
      const builder = PaymentBuilder()
      expect(
        builder.withUncheckedAmount(1.1).withSenderWallet(btcWallet).payment(),
      ).toBeInstanceOf(ValidationError)
    })

    it("sets the btcPaymentAmount based on wallet currency", () => {
      const paymentAmount = {
        amount: 1n,
        currency: WalletCurrency.Btc,
      }
      const builder = PaymentBuilder()
      const payment = builder
        .withSenderWallet(btcWallet)
        .withUncheckedAmount(Number(paymentAmount.amount))
        .withSettlementMethod(SettlementMethod.IntraLedger)
        .withPaymentInitiationMethod(PaymentInitiationMethod.IntraLedger)
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.btcPaymentAmount).toEqual(paymentAmount)
    })

    it("sets the usdPaymentAmount based on wallet currency", () => {
      const paymentAmount = {
        amount: 1n,
        currency: WalletCurrency.Usd,
      }
      const builder = PaymentBuilder()
      const payment = builder
        .withUncheckedAmount(Number(paymentAmount.amount))
        .withSenderWallet(usdWallet)
        .withSettlementMethod(SettlementMethod.IntraLedger)
        .withPaymentInitiationMethod(PaymentInitiationMethod.IntraLedger)
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.usdPaymentAmount).toEqual(paymentAmount)
    })
  })
  describe("withPaymentRequest", () => {
    it("sets the PaymentInitiationMethod when pased a payment request", () => {
      const paymentAmount = {
        amount: 1n,
        currency: WalletCurrency.Btc,
      }
      const paymentRequest = "paymentRequest" as EncodedPaymentRequest
      const builder = PaymentBuilder()
      const payment = builder
        .withBtcPaymentAmount(paymentAmount)
        .withSenderWallet(btcWallet)
        .withPaymentRequest(paymentRequest)
        .withSettlementMethod(SettlementMethod.IntraLedger)
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.paymentInitiationMethod).toEqual(PaymentInitiationMethod.Lightning)
    })
  })
  describe("withIsLocal", () => {
    it("sets the SettlementMethod to IntraLedger", () => {
      const paymentAmount = {
        amount: 1n,
        currency: WalletCurrency.Btc,
      }
      const paymentRequest = "paymentRequest" as EncodedPaymentRequest
      const builder = PaymentBuilder()
      const payment = builder
        .withBtcPaymentAmount(paymentAmount)
        .withSenderWallet(btcWallet)
        .withPaymentRequest(paymentRequest)
        .withIsLocal(true)
        .payment()
      if (payment instanceof Error) throw payment

      expect(payment.settlementMethod).toEqual(SettlementMethod.IntraLedger)
    })
  })
})
