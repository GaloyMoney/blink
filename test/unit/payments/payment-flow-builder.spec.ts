import { SettlementMethod, PaymentInitiationMethod } from "@domain/wallets"
import { SelfPaymentError } from "@domain/errors"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import {
  LightningPaymentFlowBuilder,
  LnFees,
  InvalidLightningPaymentFlowBuilderStateError,
} from "@domain/payments"
import { ValidationError, WalletCurrency } from "@domain/shared"

describe("LightningPaymentFlowBuilder", () => {
  const paymentRequestWithAmount =
    "lnbc20u1pvjluezhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqfppqw508d6qejxtdg4y5r3zarvary0c5xw7kxqrrsssp5m6kmam774klwlh4dhmhaatd7al02m0h0m6kmam774klwlh4dhmhs9qypqqqcqpf3cwux5979a8j28d4ydwahx00saa68wq3az7v9jdgzkghtxnkf3z5t7q5suyq2dl9tqwsap8j0wptc82cpyvey9gf6zyylzrm60qtcqsq7egtsq" as EncodedPaymentRequest
  const invoiceWithAmount = decodeInvoice(paymentRequestWithAmount) as LnInvoice
  const paymentRequestWithNoAmount =
    "lnbc1p3zn402pp54skf32qeal5jnfm73u5e3d9h5448l4yutszy0kr9l56vdsy8jefsdqqcqzpuxqyz5vqsp5c6z7a4lrey4ejvhx5q4l83jm9fhy34dsqgxnceem4dgz6fmh456s9qyyssqkxkg6ke6nt39dusdhpansu8j0r5f7gadwcampnw2g8ap0fccteer7hzjc8tgat9m5wxd98nxjxhwx0ha6g95v9edmgd30f0m8kujslgpxtzt6w" as EncodedPaymentRequest
  const invoiceWithNoAmount = decodeInvoice(paymentRequestWithNoAmount) as LnInvoice
  const senderBtcWallet = {
    id: "senderWalletId" as WalletId,
    currency: WalletCurrency.Btc,
  }
  const recipientBtcWallet = {
    id: "recipientWalletId" as WalletId,
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
      describe("not intraledger", () => {
        it("can build a PaymentFlow", async () => {
          const payment = await LightningPaymentFlowBuilder({
            localNodeIds: [],
            usdFromBtcMidPriceFn,
          })
            .withInvoice(invoiceWithAmount)
            .withSenderWallet(senderBtcWallet)
            .withoutRecipientWallet()
            .withConversion({
              usdFromBtc,
              btcFromUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          const usdPaymentAmount = {
            amount:
              (invoiceWithAmount.paymentAmount as BtcPaymentAmount).amount *
              midPriceRatio,
            currency: WalletCurrency.Usd,
          }
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderBtcWallet.id,
              senderWalletCurrency: senderBtcWallet.currency,

              paymentHash: invoiceWithAmount.paymentHash,
              btcPaymentAmount: invoiceWithAmount.paymentAmount,
              usdPaymentAmount,
              inputAmount: invoiceWithAmount.paymentAmount?.amount,

              settlementMethod: SettlementMethod.Lightning,
              paymentInitiationMethod: PaymentInitiationMethod.Lightning,

              btcProtocolFee: LnFees().maxProtocolFee(
                invoiceWithAmount.paymentAmount as BtcPaymentAmount,
              ),
              usdProtocolFee: LnFees().maxProtocolFee(usdPaymentAmount),
            }),
          )
        })
      })
      describe("intraledger", () => {
        describe("with btc recipient", () => {
          it("can build a PaymentFlow", async () => {
            const payment = await LightningPaymentFlowBuilder({
              localNodeIds: [invoiceWithAmount.destination],
              usdFromBtcMidPriceFn,
            })
              .withInvoice(invoiceWithAmount)
              .withSenderWallet(senderBtcWallet)
              .withRecipientWallet(recipientBtcWallet)
              .withConversion({
                usdFromBtc,
                btcFromUsd,
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            expect(payment).toEqual(
              expect.objectContaining({
                settlementMethod: SettlementMethod.IntraLedger,
                paymentInitiationMethod: PaymentInitiationMethod.Lightning,

                btcProtocolFee: LnFees().intraLedgerFees().btc,
                usdProtocolFee: LnFees().intraLedgerFees().usd,
                recipientWalletId: recipientBtcWallet.id,
                recipientWalletCurrency: recipientBtcWallet.currency,
              }),
            )
          })
        })
      })
    })
  })

  describe("invoice with no amount", () => {
    describe("with btc wallet", () => {
      describe("not intraledger", () => {
        it("can build a PaymentFlow", async () => {
          const payment = await LightningPaymentFlowBuilder({
            localNodeIds: [],
            usdFromBtcMidPriceFn,
          })
            .withNoAmountInvoice({ invoice: invoiceWithNoAmount, uncheckedAmount: 1000 })
            .withSenderWallet(senderBtcWallet)
            .withoutRecipientWallet()
            .withConversion({
              usdFromBtc,
              btcFromUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          expect(payment).toEqual(
            expect.objectContaining({
              settlementMethod: SettlementMethod.Lightning,
              btcPaymentAmount: {
                amount: 1000n,
                currency: WalletCurrency.Btc,
              },
              usdPaymentAmount: {
                amount: 1000n * midPriceRatio,
                currency: WalletCurrency.Usd,
              },
              inputAmount: 1000n,
            }),
          )
        })
      })
    })
  })

  describe("error states", () => {
    describe("non-integer uncheckedAmount", () => {
      it("returns a ValidationError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [],
          usdFromBtcMidPriceFn,
        })
          .withNoAmountInvoice({ invoice: invoiceWithNoAmount, uncheckedAmount: 0.4 })
          .withSenderWallet(senderBtcWallet)
          .withoutRecipientWallet()
          .withConversion({
            usdFromBtc,
            btcFromUsd,
          })
          .withoutRoute()

        expect(payment).toBeInstanceOf(ValidationError)
      })
    })
    describe("no recipient wallet despite IntraLedger", () => {
      it("returns InvalidLightningPaymentFlowBuilderStateError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [invoiceWithAmount.destination],
          usdFromBtcMidPriceFn,
        })
          .withInvoice(invoiceWithAmount)
          .withSenderWallet(senderBtcWallet)
          .withoutRecipientWallet()
          .withConversion({
            usdFromBtc,
            btcFromUsd,
          })
          .withoutRoute()

        expect(payment).toBeInstanceOf(InvalidLightningPaymentFlowBuilderStateError)
      })
    })

    describe("recipient is usd wallet but no usd amount specified", () => {
      it("returns ImpossibleLightningPaymentFlowBuilderStateError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [invoiceWithAmount.destination],
          usdFromBtcMidPriceFn,
        })
          .withInvoice(invoiceWithAmount)
          .withSenderWallet(senderBtcWallet)
          .withRecipientWallet(usdWallet)
          .withConversion({
            usdFromBtc,
            btcFromUsd,
          })
          .withoutRoute()

        expect(payment).toBeInstanceOf(InvalidLightningPaymentFlowBuilderStateError)
      })
    })

    describe("sender and recipient are identical", () => {
      it("returns ImpossibleLightningPaymentFlowBuilderStateError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [invoiceWithAmount.destination],
          usdFromBtcMidPriceFn,
        })
          .withInvoice(invoiceWithAmount)
          .withSenderWallet(senderBtcWallet)
          .withRecipientWallet(senderBtcWallet)
          .withConversion({
            usdFromBtc,
            btcFromUsd,
          })
          .withoutRoute()

        expect(payment).toBeInstanceOf(SelfPaymentError)
      })
    })
  })
})
