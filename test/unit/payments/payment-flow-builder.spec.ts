import { SettlementMethod, PaymentInitiationMethod } from "@domain/wallets"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { SelfPaymentError } from "@domain/errors"
import {
  LightningPaymentFlowBuilder,
  LnFees,
  InvalidLightningPaymentFlowBuilderStateError,
  PriceRatio,
} from "@domain/payments"
import { ValidationError, WalletCurrency } from "@domain/shared"

const muunPubkey =
  "038f8f113c580048d847d6949371726653e02b928196bad310e3eda39ff61723f6" as Pubkey

describe("LightningPaymentFlowBuilder", () => {
  const paymentRequestWithAmount =
    "lnbc210u1p32zq9xpp5dpzhj6e7y6d4ggs6awh7m4eupuemas0gq06pqjgy9tq35740jlfsdqqcqzpgxqyz5vqsp58t3zalj5sc563g0xpcgx9lfkeqrx7m7xw53v2txc2pr60jcwn0vq9qyyssqkatadajwt0n285teummg4urul9t3shddnf05cfxzsfykvscxm4zqz37j87sahvz3kul0lzgz2svltdm933yr96du84zpyn8rx6fst4sp43jh32" as EncodedPaymentRequest
  const invoiceWithAmount = decodeInvoice(paymentRequestWithAmount) as LnInvoice
  const muunPaymentRequestWithAmount =
    "lnbc10u1p3w0mf7pp5v9xg3eksnsyrsa3vk5uv00rvye4wf9n0744xgtx0kcrafeanvx7sdqqcqzzgxqyz5vqrzjqwnvuc0u4txn35cafc7w94gxvq5p3cu9dd95f7hlrh0fvs46wpvhddrwgrqy63w5eyqqqqryqqqqthqqpyrzjqw8c7yfutqqy3kz8662fxutjvef7q2ujsxtt45csu0k688lkzu3lddrwgrqy63w5eyqqqqryqqqqthqqpysp53n0sc9hvqgdkrv4ppwrm2pa0gcysa8r2swjkrkjnxkcyrsjmxu4s9qypqsq5zvh7glzpas4l9ptxkdhgefyffkn8humq6amkrhrh2gq02gv8emxrynkwke3uwgf4cfevek89g4020lgldxgusmse79h4caqg30qq2cqmyrc7d" as EncodedPaymentRequest
  const muunInvoiceWithAmount = decodeInvoice(muunPaymentRequestWithAmount) as LnInvoice
  const paymentRequestWithNoAmount =
    "lnbc1p3zn402pp54skf32qeal5jnfm73u5e3d9h5448l4yutszy0kr9l56vdsy8jefsdqqcqzpuxqyz5vqsp5c6z7a4lrey4ejvhx5q4l83jm9fhy34dsqgxnceem4dgz6fmh456s9qyyssqkxkg6ke6nt39dusdhpansu8j0r5f7gadwcampnw2g8ap0fccteer7hzjc8tgat9m5wxd98nxjxhwx0ha6g95v9edmgd30f0m8kujslgpxtzt6w" as EncodedPaymentRequest
  const invoiceWithNoAmount = decodeInvoice(paymentRequestWithNoAmount) as LnInvoice
  const senderBtcWallet = {
    id: "senderWalletId" as WalletId,
    currency: WalletCurrency.Btc,
    accountId: "senderAccountId" as AccountId,
  } as Wallet

  const recipientBtcWallet = {
    id: "recipientWalletId" as WalletId,
    currency: WalletCurrency.Btc,
    accountId: "recipientAccountId" as AccountId,
    username: "Username" as Username,
  }
  const senderUsdWallet = {
    id: "walletId" as WalletId,
    currency: WalletCurrency.Usd,
    accountId: "senderAccountId" as AccountId,
  } as Wallet
  const recipientUsdWallet = {
    id: "recipientWalletId" as WalletId,
    currency: WalletCurrency.Usd,
    accountId: "recipientAccountId" as AccountId,
    username: "Username" as Username,
  }
  const pubkey = "pubkey" as Pubkey
  const rawRoute = { total_mtokens: "21000000", fee: 210 } as RawRoute

  // 0.02 ratio (0.02 cents/sat, or $20,000 USD/BTC)
  const midPriceRatio = 0.02
  const immediateSpread = 0.001 // 0.10 %
  // const futureSpread = 0.0012 // 0.12%

  const centsFromSats = ({ sats, spread, round }): bigint =>
    BigInt(round(sats * midPriceRatio * spread))
  const satsFromCents = ({ cents, spread, round }): bigint =>
    BigInt(round((cents / midPriceRatio) * spread))

  const usdFromBtcMid = async (amount: BtcPaymentAmount) => {
    return Promise.resolve({
      amount: centsFromSats({
        sats: Number(amount.amount),
        spread: 1,
        round: Math.round,
      }),
      currency: WalletCurrency.Usd,
    })
  }
  const btcFromUsdMid = async (amount: UsdPaymentAmount) => {
    return Promise.resolve({
      amount: satsFromCents({
        cents: Number(amount.amount),
        spread: 1,
        round: Math.round,
      }),
      currency: WalletCurrency.Btc,
    })
  }
  const mid = { usdFromBtc: usdFromBtcMid, btcFromUsd: btcFromUsdMid }

  const usdFromBtcBuy = async (amount: BtcPaymentAmount) => {
    return Promise.resolve({
      amount: centsFromSats({
        sats: Number(amount.amount),
        spread: 1 - immediateSpread,
        round: Math.floor,
      }),
      currency: WalletCurrency.Usd,
    })
  }
  const btcFromUsdBuy = async (amount: UsdPaymentAmount) => {
    return Promise.resolve({
      amount: satsFromCents({
        cents: Number(amount.amount),
        spread: 1 + immediateSpread,
        round: Math.ceil,
      }),
      currency: WalletCurrency.Btc,
    })
  }
  const hedgeBuyUsd = {
    usdFromBtc: usdFromBtcBuy,
    btcFromUsd: btcFromUsdBuy,
  }

  const usdFromBtcSell = async (amount: BtcPaymentAmount) => {
    return Promise.resolve({
      amount: centsFromSats({
        sats: Number(amount.amount),
        spread: 1 + immediateSpread,
        round: Math.ceil,
      }),
      currency: WalletCurrency.Usd,
    })
  }
  const btcFromUsdSell = async (amount: UsdPaymentAmount) => {
    return Promise.resolve({
      amount: satsFromCents({
        cents: Number(amount.amount),
        spread: 1 - immediateSpread,
        round: Math.floor,
      }),
      currency: WalletCurrency.Btc,
    })
  }
  const hedgeSellUsd = {
    usdFromBtc: usdFromBtcSell,
    btcFromUsd: btcFromUsdSell,
  }

  describe("ln initiated, ln settled", () => {
    const lightningBuilder = LightningPaymentFlowBuilder({
      localNodeIds: [],
      flaggedPubkeys: [muunPubkey],
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
      const withMuunAmountBuilder = lightningBuilder.withInvoice(muunInvoiceWithAmount)
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

        const withMuunBtcWalletBuilder = withMuunAmountBuilder
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

        it("sets 'skipProbe' property to true for flagged destination invoice", async () => {
          const muunBuilder = await withMuunBtcWalletBuilder.withConversion({
            mid,
            hedgeBuyUsd,
            hedgeSellUsd,
          })
          expect(muunBuilder.skipProbeForDestination()).toBeTruthy()
        })

        it("uses mid price and max btc fees", async () => {
          const payment = await withBtcWalletBuilder
            .withConversion({
              mid,
              hedgeBuyUsd,
              hedgeSellUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          if (invoiceWithAmount.paymentAmount === null)
            throw new Error("paymentAmount should not be null")

          const usdPaymentAmount = await usdFromBtcMid(invoiceWithAmount.paymentAmount)

          const btcProtocolFee = LnFees().maxProtocolFee(invoiceWithAmount.paymentAmount)
          if (btcProtocolFee instanceof Error) return btcProtocolFee
          expect(btcProtocolFee).not.toBeInstanceOf(Error)

          const priceRatio = PriceRatio(payment.paymentAmounts())
          if (priceRatio instanceof Error) throw priceRatio
          const usdProtocolFee = priceRatio.convertFromBtcToCeil(btcProtocolFee)

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              usdPaymentAmount,
              btcProtocolFee,
              usdProtocolFee,
              skipProbeForDestination: false,
            }),
          )
        })

        it("can take fees from a route", async () => {
          const payment = await withBtcWalletBuilder
            .withConversion({
              mid,
              hedgeBuyUsd,
              hedgeSellUsd,
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

          const priceRatio = PriceRatio(payment.paymentAmounts())
          if (priceRatio instanceof Error) throw priceRatio

          expect(payment).toEqual(
            expect.objectContaining({
              btcProtocolFee,
              usdProtocolFee: priceRatio.convertFromBtcToCeil(btcProtocolFee),
              outgoingNodePubkey: pubkey,
              cachedRoute: rawRoute,
              skipProbeForDestination: false,
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
              skipProbeForDestination: false,
            }),
          )
        }

        it("uses dealer price and max btc fees", async () => {
          const payment = await withUsdWalletBuilder
            .withConversion({
              mid,
              hedgeBuyUsd,
              hedgeSellUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          if (invoiceWithAmount.paymentAmount === null)
            throw new Error("paymentAmount should not be null")

          const usdPaymentAmount = await usdFromBtcSell(invoiceWithAmount.paymentAmount)

          const btcProtocolFee = LnFees().maxProtocolFee(invoiceWithAmount.paymentAmount)
          if (btcProtocolFee instanceof Error) return btcProtocolFee
          expect(btcProtocolFee).not.toBeInstanceOf(Error)

          const usdProtocolFee = await usdFromBtcSell(btcProtocolFee)

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              usdPaymentAmount,
              btcProtocolFee,
              usdProtocolFee,
              skipProbeForDestination: false,
            }),
          )
        })

        it("can take fees from a route", async () => {
          const payment = await withUsdWalletBuilder
            .withConversion({
              mid,
              hedgeBuyUsd,
              hedgeSellUsd,
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

          expect(payment).toEqual(
            expect.objectContaining({
              btcProtocolFee,
              usdProtocolFee: await usdFromBtcSell(btcProtocolFee),
              outgoingNodePubkey: pubkey,
              cachedRoute: rawRoute,
              skipProbeForDestination: false,
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
            skipProbeForDestination: false,
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
              skipProbeForDestination: false,
            }),
          )
        }

        it("uses mid price and max btc fees", async () => {
          const payment = await withBtcWalletBuilder
            .withConversion({
              mid,
              hedgeBuyUsd,
              hedgeSellUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          if (invoiceWithAmount.paymentAmount === null)
            throw new Error("paymentAmount should not be null")

          const usdPaymentAmount = await usdFromBtcMid({
            amount: uncheckedAmount,
            currency: WalletCurrency.Btc,
          })

          const btcProtocolFee = LnFees().maxProtocolFee({
            amount: uncheckedAmount,
            currency: WalletCurrency.Btc,
          })
          if (btcProtocolFee instanceof Error) return btcProtocolFee
          expect(btcProtocolFee).not.toBeInstanceOf(Error)

          const priceRatio = PriceRatio(payment.paymentAmounts())
          if (priceRatio instanceof Error) throw priceRatio
          const usdProtocolFee = priceRatio.convertFromBtcToCeil(btcProtocolFee)

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              usdPaymentAmount,
              btcProtocolFee,
              usdProtocolFee,
              skipProbeForDestination: false,
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
              skipProbeForDestination: false,
            }),
          )
        }

        it("uses dealer price and max usd fees", async () => {
          const payment = await withUsdWalletBuilder
            .withConversion({
              mid,
              hedgeBuyUsd,
              hedgeSellUsd,
            })
            .withoutRoute()
          if (payment instanceof Error) throw payment

          const btcPaymentAmount = await btcFromUsdSell({
            amount: uncheckedAmount,
            currency: WalletCurrency.Usd,
          })

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              btcPaymentAmount,
              btcProtocolFee: LnFees().maxProtocolFee(btcPaymentAmount),
              skipProbeForDestination: false,
            }),
          )
        })
      })
    })
  })

  describe("ln initiated, intraledger settled", () => {
    const intraledgerBuilder = LightningPaymentFlowBuilder({
      localNodeIds: [invoiceWithAmount.destination, invoiceWithNoAmount.destination],
      flaggedPubkeys: [muunPubkey],
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
                mid: {
                  usdFromBtc: usdFromBtcMid,
                  btcFromUsd: btcFromUsdMid,
                },
                hedgeBuyUsd: {
                  usdFromBtc: usdFromBtcBuy,
                  btcFromUsd: btcFromUsdBuy,
                },
                hedgeSellUsd: {
                  usdFromBtc: usdFromBtcSell,
                  btcFromUsd: btcFromUsdSell,
                },
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const usdPaymentAmount = await usdFromBtcMid(
              invoiceWithAmount.paymentAmount as BtcPaymentAmount,
            )

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
                mid: {
                  usdFromBtc: usdFromBtcMid,
                  btcFromUsd: btcFromUsdMid,
                },
                hedgeBuyUsd: {
                  usdFromBtc: usdFromBtcBuy,
                  btcFromUsd: btcFromUsdBuy,
                },
                hedgeSellUsd: {
                  usdFromBtc: usdFromBtcSell,
                  btcFromUsd: btcFromUsdSell,
                },
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
                mid: {
                  usdFromBtc: usdFromBtcMid,
                  btcFromUsd: btcFromUsdMid,
                },
                hedgeBuyUsd: {
                  usdFromBtc: usdFromBtcBuy,
                  btcFromUsd: btcFromUsdBuy,
                },
                hedgeSellUsd: {
                  usdFromBtc: usdFromBtcSell,
                  btcFromUsd: btcFromUsdSell,
                },
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const usdPaymentAmount = await usdFromBtcSell(
              invoiceWithAmount.paymentAmount as BtcPaymentAmount,
            )

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
                mid: {
                  usdFromBtc: usdFromBtcMid,
                  btcFromUsd: btcFromUsdMid,
                },
                hedgeBuyUsd: {
                  usdFromBtc: usdFromBtcBuy,
                  btcFromUsd: btcFromUsdBuy,
                },
                hedgeSellUsd: {
                  usdFromBtc: usdFromBtcSell,
                  btcFromUsd: btcFromUsdSell,
                },
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
                mid: {
                  usdFromBtc: usdFromBtcMid,
                  btcFromUsd: btcFromUsdMid,
                },
                hedgeBuyUsd: {
                  usdFromBtc: usdFromBtcBuy,
                  btcFromUsd: btcFromUsdBuy,
                },
                hedgeSellUsd: {
                  usdFromBtc: usdFromBtcSell,
                  btcFromUsd: btcFromUsdSell,
                },
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const usdPaymentAmount = await usdFromBtcMid({
              amount: uncheckedAmount,
              currency: WalletCurrency.Btc,
            })

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
                mid: {
                  usdFromBtc: usdFromBtcMid,
                  btcFromUsd: btcFromUsdMid,
                },
                hedgeBuyUsd: {
                  usdFromBtc: usdFromBtcBuy,
                  btcFromUsd: btcFromUsdBuy,
                },
                hedgeSellUsd: {
                  usdFromBtc: usdFromBtcSell,
                  btcFromUsd: btcFromUsdSell,
                },
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const usdPaymentAmount = await usdFromBtcBuy({
              amount: uncheckedAmount,
              currency: WalletCurrency.Btc,
            })

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
                mid: {
                  usdFromBtc: usdFromBtcMid,
                  btcFromUsd: btcFromUsdMid,
                },
                hedgeBuyUsd: {
                  usdFromBtc: usdFromBtcBuy,
                  btcFromUsd: btcFromUsdBuy,
                },
                hedgeSellUsd: {
                  usdFromBtc: usdFromBtcSell,
                  btcFromUsd: btcFromUsdSell,
                },
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const btcPaymentAmount = await btcFromUsdSell({
              amount: uncheckedAmount,
              currency: WalletCurrency.Usd,
            })

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
                mid: {
                  usdFromBtc: usdFromBtcMid,
                  btcFromUsd: btcFromUsdMid,
                },
                hedgeBuyUsd: {
                  usdFromBtc: usdFromBtcBuy,
                  btcFromUsd: btcFromUsdBuy,
                },
                hedgeSellUsd: {
                  usdFromBtc: usdFromBtcSell,
                  btcFromUsd: btcFromUsdSell,
                },
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const btcPaymentAmount = await btcFromUsdMid({
              amount: uncheckedAmount,
              currency: WalletCurrency.Usd,
            })

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
      flaggedPubkeys: [muunPubkey],
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
                mid: {
                  usdFromBtc: usdFromBtcMid,
                  btcFromUsd: btcFromUsdMid,
                },
                hedgeBuyUsd: {
                  usdFromBtc: usdFromBtcBuy,
                  btcFromUsd: btcFromUsdBuy,
                },
                hedgeSellUsd: {
                  usdFromBtc: usdFromBtcSell,
                  btcFromUsd: btcFromUsdSell,
                },
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const usdPaymentAmount = await usdFromBtcMid({
              amount: uncheckedAmount,
              currency: WalletCurrency.Btc,
            })

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
                mid: {
                  usdFromBtc: usdFromBtcMid,
                  btcFromUsd: btcFromUsdMid,
                },
                hedgeBuyUsd: {
                  usdFromBtc: usdFromBtcBuy,
                  btcFromUsd: btcFromUsdBuy,
                },
                hedgeSellUsd: {
                  usdFromBtc: usdFromBtcSell,
                  btcFromUsd: btcFromUsdSell,
                },
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const usdPaymentAmount = await usdFromBtcBuy({
              amount: uncheckedAmount,
              currency: WalletCurrency.Btc,
            })

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
                mid: {
                  usdFromBtc: usdFromBtcMid,
                  btcFromUsd: btcFromUsdMid,
                },
                hedgeBuyUsd: {
                  usdFromBtc: usdFromBtcBuy,
                  btcFromUsd: btcFromUsdBuy,
                },
                hedgeSellUsd: {
                  usdFromBtc: usdFromBtcSell,
                  btcFromUsd: btcFromUsdSell,
                },
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const btcPaymentAmount = await btcFromUsdSell({
              amount: uncheckedAmount,
              currency: WalletCurrency.Usd,
            })

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
                mid: {
                  usdFromBtc: usdFromBtcMid,
                  btcFromUsd: btcFromUsdMid,
                },
                hedgeBuyUsd: {
                  usdFromBtc: usdFromBtcBuy,
                  btcFromUsd: btcFromUsdBuy,
                },
                hedgeSellUsd: {
                  usdFromBtc: usdFromBtcSell,
                  btcFromUsd: btcFromUsdSell,
                },
              })
              .withoutRoute()
            if (payment instanceof Error) throw payment

            const btcPaymentAmount = await btcFromUsdMid({
              amount: uncheckedAmount,
              currency: WalletCurrency.Usd,
            })

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
          flaggedPubkeys: [muunPubkey],
        })
          .withInvoice(invoiceWithNoAmount)
          .withSenderWallet(senderBtcWallet)
          .withoutRecipientWallet()
          .withConversion({
            mid,
            hedgeBuyUsd,
            hedgeSellUsd,
          })
          .withoutRoute()

        expect(payment).toBeInstanceOf(InvalidLightningPaymentFlowBuilderStateError)
      })
    })
    describe("non-integer uncheckedAmount", () => {
      it("returns a ValidationError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [],
          flaggedPubkeys: [muunPubkey],
        })
          .withNoAmountInvoice({ invoice: invoiceWithNoAmount, uncheckedAmount: 0.4 })
          .withSenderWallet(senderBtcWallet)
          .withoutRecipientWallet()
          .withConversion({
            mid,
            hedgeBuyUsd,
            hedgeSellUsd,
          })
          .withoutRoute()

        expect(payment).toBeInstanceOf(ValidationError)
      })
    })
    describe("zero-value uncheckedAmount", () => {
      it("returns a ValidationError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [],
          flaggedPubkeys: [muunPubkey],
        })
          .withNoAmountInvoice({ invoice: invoiceWithNoAmount, uncheckedAmount: 0 })
          .withSenderWallet(senderBtcWallet)
          .withoutRecipientWallet()
          .withConversion({
            mid,
            hedgeBuyUsd,
            hedgeSellUsd,
          })
          .withoutRoute()

        expect(payment).toBeInstanceOf(ValidationError)
      })
    })
    describe("no recipient wallet despite IntraLedger", () => {
      it("returns InvalidLightningPaymentFlowBuilderStateError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [invoiceWithAmount.destination],
          flaggedPubkeys: [muunPubkey],
        })
          .withInvoice(invoiceWithAmount)
          .withSenderWallet(senderBtcWallet)
          .withoutRecipientWallet()
          .withConversion({
            mid,
            hedgeBuyUsd,
            hedgeSellUsd,
          })
          .withoutRoute()

        expect(payment).toBeInstanceOf(InvalidLightningPaymentFlowBuilderStateError)
      })
    })

    describe("recipient is usd wallet but no usd amount specified", () => {
      it("returns ImpossibleLightningPaymentFlowBuilderStateError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [invoiceWithAmount.destination],
          flaggedPubkeys: [muunPubkey],
        })
          .withInvoice(invoiceWithAmount)
          .withSenderWallet(senderBtcWallet)
          .withRecipientWallet(senderUsdWallet)
          .withConversion({
            mid,
            hedgeBuyUsd,
            hedgeSellUsd,
          })
          .withoutRoute()

        expect(payment).toBeInstanceOf(InvalidLightningPaymentFlowBuilderStateError)
      })
    })

    describe("recipient is usd wallet and amount is specifies (for no amount invoice)", () => {
      it("returns ImpossibleLightningPaymentFlowBuilderStateError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [invoiceWithNoAmount.destination],
          flaggedPubkeys: [muunPubkey],
        })
          .withNoAmountInvoice({ invoice: invoiceWithNoAmount, uncheckedAmount: 1000 })
          .withSenderWallet(senderBtcWallet)
          .withRecipientWallet({
            ...senderUsdWallet,
            usdPaymentAmount: { amount: 1000n, currency: WalletCurrency.Usd },
          })
          .withConversion({
            mid,
            hedgeBuyUsd,
            hedgeSellUsd,
          })
          .withoutRoute()

        expect(payment).toBeInstanceOf(InvalidLightningPaymentFlowBuilderStateError)
      })
    })

    describe("sender and recipient are identical", () => {
      it("returns ImpossibleLightningPaymentFlowBuilderStateError", async () => {
        const payment = await LightningPaymentFlowBuilder({
          localNodeIds: [invoiceWithAmount.destination],
          flaggedPubkeys: [muunPubkey],
        })
          .withInvoice(invoiceWithAmount)
          .withSenderWallet(senderBtcWallet)
          .withRecipientWallet(senderBtcWallet)
          .withConversion({
            mid,
            hedgeBuyUsd,
            hedgeSellUsd,
          })
          .withoutRoute()

        expect(payment).toBeInstanceOf(SelfPaymentError)
      })
    })
  })
})
