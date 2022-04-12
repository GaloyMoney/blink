import { SettlementMethod, PaymentInitiationMethod } from "@domain/wallets"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { SelfPaymentError } from "@domain/errors"
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
    username: "Username" as Username,
  }
  const senderUsdWallet = {
    id: "walletId" as WalletId,
    currency: WalletCurrency.Usd,
  }
  const recipientUsdWallet = {
    id: "recipientWalletId" as WalletId,
    currency: WalletCurrency.Usd,
    username: "Username" as Username,
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
  const btcFromUsdMidPriceFn = async (amount: UsdPaymentAmount) => {
    return Promise.resolve({
      amount: amount.amount / midPriceRatio,
      currency: WalletCurrency.Btc,
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

  describe("not intraledger", () => {
    const lightningBuilder = LightningPaymentFlowBuilder({
      localNodeIds: [],
      usdFromBtcMidPriceFn,
      btcFromUsdMidPriceFn,
    })
    const checkSettlementMethod = (payment) => {
      expect(payment).toEqual(
        expect.objectContaining({
          settlementMethod: SettlementMethod.Lightning,
          paymentInitiationMethod: PaymentInitiationMethod.Lightning,
        }),
      )
    }

    describe("invoice with amount", () => {
      const withAmountBuilder = lightningBuilder.withInvoice(invoiceWithAmount)
      const checkInvoice = (payment) => {
        expect(payment).toEqual(
          expect.objectContaining({
            btcPaymentAmount: invoiceWithAmount.paymentAmount,
            inputAmount: invoiceWithAmount.paymentAmount?.amount,
          }),
        )
      }

      describe("with btc wallet", () => {
        const withBtcWalletBuilder = withAmountBuilder
          .withSenderWallet(senderBtcWallet)
          .withoutRecipientWallet()

        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderBtcWallet.id,
              senderWalletCurrency: senderBtcWallet.currency,
            }),
          )
        }

        it("uses mid price and max fees", async () => {
          const payment = await withBtcWalletBuilder
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

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              usdPaymentAmount,
              btcProtocolFee: LnFees().maxProtocolFee(
                invoiceWithAmount.paymentAmount as BtcPaymentAmount,
              ),
              usdProtocolFee: LnFees().maxProtocolFee(usdPaymentAmount),
            }),
          )
        })

        it("can take fees from a route", async () => {
          const payment = await withBtcWalletBuilder
            .withConversion({
              usdFromBtc,
              btcFromUsd,
            })
            .withRoute({
              pubkey,
              rawRoute,
            })
          if (payment instanceof Error) throw payment

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)

          const btcProtocolFee = LnFees().feeFromRawRoute(rawRoute)
          expect(payment).toEqual(
            expect.objectContaining({
              btcProtocolFee,
              usdProtocolFee: {
                amount: btcProtocolFee.amount * midPriceRatio,
                currency: WalletCurrency.Usd,
              },
              outgoingNodePubkey: pubkey,
              cachedRoute: rawRoute,
            }),
          )
        })
      })

      describe("with usd wallet", () => {
        const withUsdWalletBuilder = withAmountBuilder
          .withSenderWallet(senderUsdWallet)
          .withoutRecipientWallet()

        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderUsdWallet.id,
              senderWalletCurrency: senderUsdWallet.currency,
            }),
          )
        }

        it("uses dealer price", async () => {
          const payment = await withUsdWalletBuilder
            .withConversion({
              usdFromBtc,
              btcFromUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          const usdPaymentAmount = {
            amount:
              (invoiceWithAmount.paymentAmount as BtcPaymentAmount).amount *
              dealerPriceRatio,
            currency: WalletCurrency.Usd,
          }

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              usdPaymentAmount,
            }),
          )
        })
      })
    })

    describe("invoice with no amount", () => {
      const uncheckedAmount = 10000n
      const withAmountBuilder = lightningBuilder.withNoAmountInvoice({
        invoice: invoiceWithNoAmount,
        uncheckedAmount: Number(uncheckedAmount),
      })
      const checkInvoice = (payment) => {
        expect(payment).toEqual(
          expect.objectContaining({
            inputAmount: uncheckedAmount,
          }),
        )
      }

      describe("with btc wallet", () => {
        const withBtcWalletBuilder = withAmountBuilder
          .withSenderWallet(senderBtcWallet)
          .withoutRecipientWallet()

        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderBtcWallet.id,
              senderWalletCurrency: senderBtcWallet.currency,
              btcPaymentAmount: {
                amount: uncheckedAmount,
                currency: WalletCurrency.Btc,
              },
            }),
          )
        }

        it("uses mid price and max fees", async () => {
          const payment = await withBtcWalletBuilder
            .withConversion({
              usdFromBtc,
              btcFromUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          const usdPaymentAmount = {
            amount: uncheckedAmount * midPriceRatio,
            currency: WalletCurrency.Usd,
          }

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              usdPaymentAmount,
              btcProtocolFee: LnFees().maxProtocolFee({
                amount: uncheckedAmount,
                currency: WalletCurrency.Btc,
              }),
              usdProtocolFee: LnFees().maxProtocolFee(usdPaymentAmount),
            }),
          )
        })
      })

      describe("with usd wallet", () => {
        const withUsdWalletBuilder = withAmountBuilder
          .withSenderWallet(senderUsdWallet)
          .withoutRecipientWallet()

        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderUsdWallet.id,
              senderWalletCurrency: senderUsdWallet.currency,
              usdPaymentAmount: {
                amount: uncheckedAmount,
                currency: WalletCurrency.Usd,
              },
            }),
          )
        }

        it("uses dealer price", async () => {
          const payment = await withUsdWalletBuilder
            .withConversion({
              usdFromBtc,
              btcFromUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          const btcPaymentAmount = {
            amount: uncheckedAmount / dealerPriceRatio,
            currency: WalletCurrency.Btc,
          }

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              btcPaymentAmount,
              btcProtocolFee: LnFees().maxProtocolFee(btcPaymentAmount),
            }),
          )
        })
      })
    })
  })

  describe("intraledger", () => {
    const intraledgerBuilder = LightningPaymentFlowBuilder({
      localNodeIds: [invoiceWithAmount.destination, invoiceWithNoAmount.destination],
      usdFromBtcMidPriceFn,
      btcFromUsdMidPriceFn,
    })
    const checkSettlementMethod = (payment) => {
      expect(payment).toEqual(
        expect.objectContaining({
          settlementMethod: SettlementMethod.IntraLedger,
          paymentInitiationMethod: PaymentInitiationMethod.Lightning,
          btcProtocolFee: LnFees().intraLedgerFees().btc,
          usdProtocolFee: LnFees().intraLedgerFees().usd,
        }),
      )
    }
    describe("invoice with amount", () => {
      const withAmountBuilder = intraledgerBuilder.withInvoice(invoiceWithAmount)
      const checkInvoice = (payment) => {
        expect(payment).toEqual(
          expect.objectContaining({
            btcPaymentAmount: invoiceWithAmount.paymentAmount,
            inputAmount: invoiceWithAmount.paymentAmount?.amount,
          }),
        )
      }
      describe("with btc wallet", () => {
        const withBtcWalletBuilder = withAmountBuilder.withSenderWallet(senderBtcWallet)

        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderBtcWallet.id,
              senderWalletCurrency: senderBtcWallet.currency,
            }),
          )
        }

        describe("with btc recipient", () => {
          const withBtcRecipientBuilder =
            withBtcWalletBuilder.withRecipientWallet(recipientBtcWallet)
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientBtcWallet.id,
                recipientWalletCurrency: recipientBtcWallet.currency,
                recipientUsername: recipientBtcWallet.username,
              }),
            )
          }
          it("uses mid price and intraledeger fees", async () => {
            const payment = await withBtcRecipientBuilder
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

            checkSettlementMethod(payment)
            checkInvoice(payment)
            checkSenderWallet(payment)
            checkRecipientWallet(payment)
            expect(payment).toEqual(
              expect.objectContaining({
                usdPaymentAmount,
              }),
            )
          })
        })
        describe("with usd recipient", () => {
          const usdPaymentAmount = {
            amount: 111111n,
            currency: WalletCurrency.Usd,
          }
          const withUsdRecipientBuilder = withBtcWalletBuilder.withRecipientWallet({
            ...recipientUsdWallet,
            usdPaymentAmount,
          })
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientUsdWallet.id,
                recipientWalletCurrency: recipientUsdWallet.currency,
                recipientUsername: recipientUsdWallet.username,
                usdPaymentAmount,
              }),
            )
          }

          it("uses amount specified by recipient invoice", async () => {
            const payment = await withUsdRecipientBuilder
              .withConversion({
                usdFromBtc,
                btcFromUsd,
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            checkSettlementMethod(payment)
            checkInvoice(payment)
            checkSenderWallet(payment)
            checkRecipientWallet(payment)
          })
        })
      })
    })
    describe("invoice with no amount", () => {
      const uncheckedAmount = 10000n
      const withAmountBuilder = intraledgerBuilder.withNoAmountInvoice({
        invoice: invoiceWithNoAmount,
        uncheckedAmount: Number(uncheckedAmount),
      })
      const checkInvoice = (payment) => {
        expect(payment).toEqual(
          expect.objectContaining({
            inputAmount: uncheckedAmount,
          }),
        )
      }
      describe("with btc wallet", () => {
        const withBtcWalletBuilder = withAmountBuilder.withSenderWallet(senderBtcWallet)

        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderBtcWallet.id,
              senderWalletCurrency: senderBtcWallet.currency,
              btcPaymentAmount: {
                amount: uncheckedAmount,
                currency: WalletCurrency.Btc,
              },
            }),
          )
        }

        describe("with btc recipient", () => {
          const withBtcRecipientBuilder =
            withBtcWalletBuilder.withRecipientWallet(recipientBtcWallet)
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientBtcWallet.id,
                recipientWalletCurrency: recipientBtcWallet.currency,
                recipientUsername: recipientBtcWallet.username,
              }),
            )
          }

          it("uses mid price", async () => {
            const payment = await withBtcRecipientBuilder
              .withConversion({
                usdFromBtc,
                btcFromUsd,
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const usdPaymentAmount = {
              amount: uncheckedAmount * midPriceRatio,
              currency: WalletCurrency.Usd,
            }

            checkSettlementMethod(payment)
            checkInvoice(payment)
            checkSenderWallet(payment)
            checkRecipientWallet(payment)
            expect(payment).toEqual(
              expect.objectContaining({
                usdPaymentAmount,
              }),
            )
          })
        })

        describe("with usd recipient", () => {
          const withUsdRecipientBuilder =
            withBtcWalletBuilder.withRecipientWallet(recipientUsdWallet)
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientUsdWallet.id,
                recipientWalletCurrency: recipientUsdWallet.currency,
                recipientUsername: recipientUsdWallet.username,
              }),
            )
          }

          it("uses dealer price", async () => {
            const payment = await withUsdRecipientBuilder
              .withConversion({
                usdFromBtc,
                btcFromUsd,
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const usdPaymentAmount = {
              amount: uncheckedAmount * dealerPriceRatio,
              currency: WalletCurrency.Usd,
            }

            checkSettlementMethod(payment)
            checkInvoice(payment)
            checkSenderWallet(payment)
            checkRecipientWallet(payment)
            expect(payment).toEqual(
              expect.objectContaining({
                usdPaymentAmount,
              }),
            )
          })
        })
      })

      describe("with usd wallet", () => {
        const withUsdWalletBuilder = withAmountBuilder.withSenderWallet(senderUsdWallet)

        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderUsdWallet.id,
              senderWalletCurrency: senderUsdWallet.currency,
              usdPaymentAmount: {
                amount: uncheckedAmount,
                currency: WalletCurrency.Usd,
              },
            }),
          )
        }

        describe("with btc recipient", () => {
          const withBtcRecipientBuilder =
            withUsdWalletBuilder.withRecipientWallet(recipientBtcWallet)
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientBtcWallet.id,
                recipientWalletCurrency: recipientBtcWallet.currency,
                recipientUsername: recipientUsdWallet.username,
              }),
            )
          }
          it("uses dealer price", async () => {
            const payment = await withBtcRecipientBuilder
              .withConversion({
                usdFromBtc,
                btcFromUsd,
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const btcPaymentAmount = {
              amount: uncheckedAmount / dealerPriceRatio,
              currency: WalletCurrency.Btc,
            }

            checkSettlementMethod(payment)
            checkInvoice(payment)
            checkSenderWallet(payment)
            checkRecipientWallet(payment)
            expect(payment).toEqual(
              expect.objectContaining({
                btcPaymentAmount,
              }),
            )
          })
        })
        describe("with usd recipient", () => {
          const withUsdRecipientBuilder =
            withUsdWalletBuilder.withRecipientWallet(recipientUsdWallet)
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientUsdWallet.id,
                recipientWalletCurrency: recipientUsdWallet.currency,
                recipientUsername: recipientUsdWallet.username,
              }),
            )
          }

          it("uses mid price", async () => {
            const payment = await withUsdRecipientBuilder
              .withConversion({
                usdFromBtc,
                btcFromUsd,
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const btcPaymentAmount = {
              amount: uncheckedAmount / midPriceRatio,
              currency: WalletCurrency.Btc,
            }

            checkSettlementMethod(payment)
            checkInvoice(payment)
            checkSenderWallet(payment)
            checkRecipientWallet(payment)
            expect(payment).toEqual(
              expect.objectContaining({
                btcPaymentAmount,
              }),
            )
          })
        })
      })
    })
  })

  describe("error states", () => {
    describe("pass a NoAmount invoice to withInvoice", () => {
      it("returns a ValidationError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [],
          usdFromBtcMidPriceFn,
          btcFromUsdMidPriceFn,
        })
          .withInvoice(invoiceWithNoAmount)
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
    describe("non-integer uncheckedAmount", () => {
      it("returns a ValidationError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [],
          usdFromBtcMidPriceFn,
          btcFromUsdMidPriceFn,
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
          btcFromUsdMidPriceFn,
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
          btcFromUsdMidPriceFn,
        })
          .withInvoice(invoiceWithAmount)
          .withSenderWallet(senderBtcWallet)
          .withRecipientWallet(senderUsdWallet)
          .withConversion({
            usdFromBtc,
            btcFromUsd,
          })
          .withoutRoute()

        expect(payment).toBeInstanceOf(InvalidLightningPaymentFlowBuilderStateError)
      })
    })

    describe("recipient is usd wallet and amount is specifies (for no amount invoice)", () => {
      it("returns ImpossibleLightningPaymentFlowBuilderStateError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [invoiceWithNoAmount.destination],
          usdFromBtcMidPriceFn,
          btcFromUsdMidPriceFn,
        })
          .withNoAmountInvoice({ invoice: invoiceWithNoAmount, uncheckedAmount: 1000 })
          .withSenderWallet(senderBtcWallet)
          .withRecipientWallet({
            ...senderUsdWallet,
            usdPaymentAmount: { amount: 1000n, currency: WalletCurrency.Usd },
          })
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
          btcFromUsdMidPriceFn,
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
