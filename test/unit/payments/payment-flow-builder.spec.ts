import { SettlementMethod, PaymentInitiationMethod } from "@domain/wallets"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { SelfPaymentError } from "@domain/errors"
import {
  LightningPaymentFlowBuilder,
  LnFees,
  InvalidLightningPaymentFlowBuilderStateError,
} from "@domain/payments"
import { AmountCalculator, ValidationError, WalletCurrency } from "@domain/shared"

const calc = AmountCalculator()

describe("LightningPaymentFlowBuilder", () => {
  const paymentRequestWithAmount =
    "lnbc210u1p32zq9xpp5dpzhj6e7y6d4ggs6awh7m4eupuemas0gq06pqjgy9tq35740jlfsdqqcqzpgxqyz5vqsp58t3zalj5sc563g0xpcgx9lfkeqrx7m7xw53v2txc2pr60jcwn0vq9qyyssqkatadajwt0n285teummg4urul9t3shddnf05cfxzsfykvscxm4zqz37j87sahvz3kul0lzgz2svltdm933yr96du84zpyn8rx6fst4sp43jh32" as EncodedPaymentRequest
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
  const rawRoute = { total_mtokens: "21000000", fee: 210 } as RawRoute

  // ~0.045 ratio (0.045 cents/sat, or $45,455 USD/BTC)
  const inverseMidPriceRatio = 22n
  const mulByMidPriceRatio = (amount: bigint): bigint => amount / inverseMidPriceRatio
  const mulCeilByMidPriceRatio = (amount: bigint): bigint =>
    calc.divCeil({ amount, currency: WalletCurrency.Btc }, inverseMidPriceRatio).amount
  const divByMidPriceRatio = (amount: bigint): bigint => amount * inverseMidPriceRatio

  // ~0.3448 ratio (~32% spread on 0.045 cents/sat rate)
  const inverseDealerPriceRatio = 29n
  const mulByDealerPriceRatio = (amount: bigint): bigint =>
    amount / inverseDealerPriceRatio
  const mulCeilByDealerPriceRatio = (amount: bigint): bigint =>
    calc.divCeil({ amount, currency: WalletCurrency.Btc }, inverseDealerPriceRatio).amount
  const divByDealerPriceRatio = (amount: bigint): bigint =>
    amount * inverseDealerPriceRatio

  const usdFromBtcMidPriceFn = async (amount: BtcPaymentAmount) => {
    return Promise.resolve({
      amount: mulByMidPriceRatio(amount.amount),
      currency: WalletCurrency.Usd,
    })
  }
  const btcFromUsdMidPriceFn = async (amount: UsdPaymentAmount) => {
    return Promise.resolve({
      amount: divByMidPriceRatio(amount.amount),
      currency: WalletCurrency.Btc,
    })
  }
  const usdFromBtc = async (amount: BtcPaymentAmount) => {
    return Promise.resolve({
      amount: mulByDealerPriceRatio(amount.amount),
      currency: WalletCurrency.Usd,
    })
  }
  const btcFromUsd = async (amount: UsdPaymentAmount) => {
    return Promise.resolve({
      amount: divByDealerPriceRatio(amount.amount),
      currency: WalletCurrency.Btc,
    })
  }

  describe("ln initiated, ln settled", () => {
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

        it("uses mid price and max btc fees", async () => {
          const payment = await withBtcWalletBuilder
            .withConversion({
              usdFromBtc,
              btcFromUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          if (invoiceWithAmount.paymentAmount === null)
            throw new Error("paymentAmount should not be null")

          const usdPaymentAmount = {
            amount: mulByMidPriceRatio(invoiceWithAmount.paymentAmount.amount),
            currency: WalletCurrency.Usd,
          }

          const btcProtocolFee = LnFees().maxProtocolFee(invoiceWithAmount.paymentAmount)
          if (btcProtocolFee instanceof Error) return btcProtocolFee
          expect(btcProtocolFee).not.toBeInstanceOf(Error)

          const usdProtocolFee = {
            amount: mulCeilByMidPriceRatio(btcProtocolFee.amount),
            currency: WalletCurrency.Usd,
          }

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              usdPaymentAmount,
              btcProtocolFee,
              usdProtocolFee,
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
          if (btcProtocolFee instanceof Error) return btcProtocolFee
          expect(btcProtocolFee).not.toBeInstanceOf(Error)

          // Ensure divCeil will be different from divFloor
          const amountToMod = btcProtocolFee.amount
          expect(mulByDealerPriceRatio(amountToMod)).not.toEqual(
            mulByMidPriceRatio(amountToMod),
          )
          expect(amountToMod % inverseMidPriceRatio).not.toEqual(0n)

          expect(payment).toEqual(
            expect.objectContaining({
              btcProtocolFee,
              usdProtocolFee: {
                amount: mulCeilByMidPriceRatio(btcProtocolFee.amount),
                currency: WalletCurrency.Usd,
              },
              outgoingNodePubkey: pubkey,
              cachedRoute: rawRoute,
            }),
          )

          const { rawRoute: returnedRawRoute, outgoingNodePubkey } =
            payment.routeDetails()
          expect(returnedRawRoute).toStrictEqual(rawRoute)
          expect(outgoingNodePubkey).toBe(pubkey)
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

        it("uses dealer price and max btc fees", async () => {
          const payment = await withUsdWalletBuilder
            .withConversion({
              usdFromBtc,
              btcFromUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          if (invoiceWithAmount.paymentAmount === null)
            throw new Error("paymentAmount should not be null")

          const usdPaymentAmount = {
            amount: mulByDealerPriceRatio(invoiceWithAmount.paymentAmount.amount),
            currency: WalletCurrency.Usd,
          }

          const btcProtocolFee = LnFees().maxProtocolFee(invoiceWithAmount.paymentAmount)
          if (btcProtocolFee instanceof Error) return btcProtocolFee
          expect(btcProtocolFee).not.toBeInstanceOf(Error)

          const usdProtocolFee = {
            amount: mulCeilByDealerPriceRatio(btcProtocolFee.amount),
            currency: WalletCurrency.Usd,
          }

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              usdPaymentAmount,
              btcProtocolFee,
              usdProtocolFee,
            }),
          )
        })

        it("can take fees from a route", async () => {
          const payment = await withUsdWalletBuilder
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
          if (btcProtocolFee instanceof Error) return btcProtocolFee
          expect(btcProtocolFee).not.toBeInstanceOf(Error)

          // Ensure divCeil will be different from divFloor
          const amountToMod = btcProtocolFee.amount
          expect(mulByDealerPriceRatio(amountToMod)).not.toEqual(
            mulByMidPriceRatio(amountToMod),
          )
          expect(amountToMod % inverseDealerPriceRatio).not.toEqual(0n)

          expect(payment).toEqual(
            expect.objectContaining({
              btcProtocolFee,
              usdProtocolFee: {
                amount: mulCeilByDealerPriceRatio(btcProtocolFee.amount),
                currency: WalletCurrency.Usd,
              },
              outgoingNodePubkey: pubkey,
              cachedRoute: rawRoute,
            }),
          )

          const { rawRoute: returnedRawRoute, outgoingNodePubkey } =
            payment.routeDetails()
          expect(returnedRawRoute).toStrictEqual(rawRoute)
          expect(outgoingNodePubkey).toBe(pubkey)
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

        it("uses mid price and max btc fees", async () => {
          const payment = await withBtcWalletBuilder
            .withConversion({
              usdFromBtc,
              btcFromUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          if (invoiceWithAmount.paymentAmount === null)
            throw new Error("paymentAmount should not be null")

          const usdPaymentAmount = {
            amount: mulByMidPriceRatio(uncheckedAmount),
            currency: WalletCurrency.Usd,
          }

          const btcProtocolFee = LnFees().maxProtocolFee({
            amount: uncheckedAmount,
            currency: WalletCurrency.Btc,
          })
          if (btcProtocolFee instanceof Error) return btcProtocolFee
          expect(btcProtocolFee).not.toBeInstanceOf(Error)

          const usdProtocolFee = {
            amount: mulCeilByMidPriceRatio(btcProtocolFee.amount),
            currency: WalletCurrency.Usd,
          }

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              usdPaymentAmount,
              btcProtocolFee,
              usdProtocolFee,
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

        it("uses dealer price and max usd fees", async () => {
          const payment = await withUsdWalletBuilder
            .withConversion({
              usdFromBtc,
              btcFromUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          const btcPaymentAmount = {
            amount: divByDealerPriceRatio(uncheckedAmount),
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

  describe("ln initiated, intraledger settled", () => {
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
          it("uses mid price and intraledger fees", async () => {
            const payment = await withBtcRecipientBuilder
              .withConversion({
                usdFromBtc,
                btcFromUsd,
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const usdPaymentAmount = {
              amount: mulByMidPriceRatio(
                (invoiceWithAmount.paymentAmount as BtcPaymentAmount).amount,
              ),
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
      describe("with usd wallet", () => {
        const withUsdWalletBuilder = withAmountBuilder.withSenderWallet(senderUsdWallet)

        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderUsdWallet.id,
              senderWalletCurrency: senderUsdWallet.currency,
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
                recipientUsername: recipientBtcWallet.username,
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

            const usdPaymentAmount = {
              amount: mulByDealerPriceRatio(
                (invoiceWithAmount.paymentAmount as BtcPaymentAmount).amount,
              ),
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
          const withUsdRecipientBuilder = withUsdWalletBuilder.withRecipientWallet({
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
              amount: mulByMidPriceRatio(uncheckedAmount),
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
              amount: mulByDealerPriceRatio(uncheckedAmount),
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
              amount: divByDealerPriceRatio(uncheckedAmount),
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
              amount: divByMidPriceRatio(uncheckedAmount),
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

  describe("intraledger initiated, intraledger settled", () => {
    const intraledgerBuilder = LightningPaymentFlowBuilder({
      localNodeIds: [],
      usdFromBtcMidPriceFn,
      btcFromUsdMidPriceFn,
    })
    const checkSettlementMethod = (payment) => {
      expect(payment).toEqual(
        expect.objectContaining({
          settlementMethod: SettlementMethod.IntraLedger,
          paymentInitiationMethod: PaymentInitiationMethod.IntraLedger,
          btcProtocolFee: LnFees().intraLedgerFees().btc,
          usdProtocolFee: LnFees().intraLedgerFees().usd,
        }),
      )
    }
    describe("no invoice", () => {
      const uncheckedAmount = 10000n
      const withAmountBuilder = intraledgerBuilder.withoutInvoice({
        uncheckedAmount: Number(uncheckedAmount),
        description: "",
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
              amount: mulByMidPriceRatio(uncheckedAmount),
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
              amount: mulByDealerPriceRatio(uncheckedAmount),
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
              amount: divByDealerPriceRatio(uncheckedAmount),
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
              amount: divByMidPriceRatio(uncheckedAmount),
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
    describe("zero-value uncheckedAmount", () => {
      it("returns a ValidationError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [],
          usdFromBtcMidPriceFn,
          btcFromUsdMidPriceFn,
        })
          .withNoAmountInvoice({ invoice: invoiceWithNoAmount, uncheckedAmount: 0 })
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
