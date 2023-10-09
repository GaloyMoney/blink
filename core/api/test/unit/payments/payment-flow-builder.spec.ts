/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "checkSettlementMethod", "checkInvoice", "checkSenderWallet", "checkRecipientWallet"] }] */
import { SettlementMethod, PaymentInitiationMethod } from "@/domain/wallets"
import { decodeInvoice } from "@/domain/bitcoin/lightning"
import { SelfPaymentError } from "@/domain/errors"
import {
  LightningPaymentFlowBuilder,
  LnFees,
  InvalidLightningPaymentFlowBuilderStateError,
  WalletPriceRatio,
  SubOneCentSatAmountForUsdSelfSendError,
} from "@/domain/payments"
import { ONE_CENT, ValidationError, WalletCurrency } from "@/domain/shared"

const skippedPubkey =
  "038f8f113c580048d847d6949371726653e02b928196bad310e3eda39ff61723f6" as Pubkey
const skippedChanId = "1x0x0" as ChanId
const skipProbe = { pubkey: [skippedPubkey], chanId: [skippedChanId] }

interface ConversionBtc {
  sats: number
  spread: number
  round: (x: number) => number
}
interface ConversionUsd {
  cents: number
  spread: number
  round: (x: number) => number
}

describe("LightningPaymentFlowBuilder", () => {
  const paymentRequestWithAmount =
    "lnbc210u1p32zq9xpp5dpzhj6e7y6d4ggs6awh7m4eupuemas0gq06pqjgy9tq35740jlfsdqqcqzpgxqyz5vqsp58t3zalj5sc563g0xpcgx9lfkeqrx7m7xw53v2txc2pr60jcwn0vq9qyyssqkatadajwt0n285teummg4urul9t3shddnf05cfxzsfykvscxm4zqz37j87sahvz3kul0lzgz2svltdm933yr96du84zpyn8rx6fst4sp43jh32" as EncodedPaymentRequest
  const invoiceWithAmount = decodeInvoice(paymentRequestWithAmount) as LnInvoice

  const skippedPubkeyPaymentRequestWithAmount =
    "lnbc10u1p3w0mf7pp5v9xg3eksnsyrsa3vk5uv00rvye4wf9n0744xgtx0kcrafeanvx7sdqqcqzzgxqyz5vqrzjqwnvuc0u4txn35cafc7w94gxvq5p3cu9dd95f7hlrh0fvs46wpvhddrwgrqy63w5eyqqqqryqqqqthqqpyrzjqw8c7yfutqqy3kz8662fxutjvef7q2ujsxtt45csu0k688lkzu3lddrwgrqy63w5eyqqqqryqqqqthqqpysp53n0sc9hvqgdkrv4ppwrm2pa0gcysa8r2swjkrkjnxkcyrsjmxu4s9qypqsq5zvh7glzpas4l9ptxkdhgefyffkn8humq6amkrhrh2gq02gv8emxrynkwke3uwgf4cfevek89g4020lgldxgusmse79h4caqg30qq2cqmyrc7d" as EncodedPaymentRequest
  const skippedPubkeyInvoiceWithAmount = decodeInvoice(
    skippedPubkeyPaymentRequestWithAmount,
  ) as LnInvoice

  const skippedChanIdPaymentRequestWithAmount =
    "lnbc1m1pjz2963pp5eeed387k90rxz9ggkarh3qzf42tw5epay0v3adv79aldgjf2a0nqdqqcqzpgxqrrssrzjqvgptfurj3528snx6e3dtwepafxw5fpzdymw9pj20jj09sunnqmwqqqqqyqqqqqqqqqqqqlgqqqqqqgqjqnp4qdruvn0zq9wqqhtryvch753zm6hqq4kyt48dsstkemjjc3njvggnqsp5s4pla42w34ekurw8ywfwjpwcakz5h3ynn8hx5znfckda8udmn5sq9qyyssq4sll8vh2n6kds0ht7l942jqa33nrrrhd9fhfdrdfec6mwtms05ppdrnztn2zg87cm4q7lye39f0gmt9tpjwy26hafrkqza4esjmctuqpxchx3a" as EncodedPaymentRequest
  const skippedChanIdInvoiceWithAmount = decodeInvoice(
    skippedChanIdPaymentRequestWithAmount,
  ) as LnInvoice

  const paymentRequestWithNoAmount =
    "lnbc1p3zn402pp54skf32qeal5jnfm73u5e3d9h5448l4yutszy0kr9l56vdsy8jefsdqqcqzpuxqyz5vqsp5c6z7a4lrey4ejvhx5q4l83jm9fhy34dsqgxnceem4dgz6fmh456s9qyyssqkxkg6ke6nt39dusdhpansu8j0r5f7gadwcampnw2g8ap0fccteer7hzjc8tgat9m5wxd98nxjxhwx0ha6g95v9edmgd30f0m8kujslgpxtzt6w" as EncodedPaymentRequest
  const invoiceWithNoAmount = decodeInvoice(paymentRequestWithNoAmount) as LnInvoice

  const senderBtcWalletDescriptor = {
    id: "senderBtcWalletId" as WalletId,
    currency: WalletCurrency.Btc,
    accountId: "senderAccountId" as AccountId,
  }

  const senderUsdWalletDescriptor = {
    id: "senderUsdWalletId" as WalletId,
    currency: WalletCurrency.Usd,
    accountId: "senderAccountId" as AccountId,
  }

  const senderAsRecipientCommonArgs = {
    userId: "senderUserId" as UserId,
    recipientWalletDescriptors: {
      [WalletCurrency.Btc]: senderBtcWalletDescriptor,
      [WalletCurrency.Usd]: senderUsdWalletDescriptor,
    },
  }
  const senderBtcAsRecipientArgs = {
    ...senderAsRecipientCommonArgs,
    defaultWalletCurrency: WalletCurrency.Btc,
  }

  const senderUsdAsRecipientArgs = {
    ...senderAsRecipientCommonArgs,
    defaultWalletCurrency: WalletCurrency.Usd,
  }

  const recipientBtcWalletDescriptor = {
    id: "recipientBtcWalletId" as WalletId,
    currency: WalletCurrency.Btc,
    accountId: "recipientAccountId" as AccountId,
  }
  const recipientUsdWalletDescriptor = {
    id: "recipientUsdWalletId" as WalletId,
    currency: WalletCurrency.Usd,
    accountId: "recipientAccountId" as AccountId,
  }

  const recipientCommonArgs = {
    recipientWalletDescriptors: {
      [WalletCurrency.Btc]: recipientBtcWalletDescriptor,
      [WalletCurrency.Usd]: recipientUsdWalletDescriptor,
    },
    username: "Username" as Username,
    userId: "recipientUserId" as UserId,
  }

  const recipientBtcArgs = {
    ...recipientCommonArgs,
    defaultWalletCurrency: WalletCurrency.Btc,
  }

  const recipientUsdArgs = {
    ...recipientCommonArgs,
    defaultWalletCurrency: WalletCurrency.Usd,
  }

  const pubkey = "pubkey" as Pubkey
  const rawRoute = { total_mtokens: "21000000", safe_fee: 210 } as RawRoute

  // 0.02 ratio (0.02 cents/sat, or $20,000 USD/BTC)
  const midPriceRatio = 0.02
  const immediateSpread = 0.001 // 0.10 %
  // const futureSpread = 0.0012 // 0.12%

  const centsFromSatsForMid = ({ sats, spread, round }: ConversionBtc): bigint => {
    if (Number(sats) === 0) return 0n

    const result = BigInt(round(sats * midPriceRatio * spread))
    return result || 1n
  }

  const centsFromSats = ({ sats, spread, round }: ConversionBtc): bigint =>
    BigInt(round(sats * midPriceRatio * spread))
  const satsFromCents = ({ cents, spread, round }: ConversionUsd): bigint =>
    BigInt(round((cents / midPriceRatio) * spread))

  const usdFromBtcMid = async (amount: BtcPaymentAmount) => {
    return Promise.resolve({
      amount: centsFromSatsForMid({
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
      skipProbe,
    })

    /* eslint @typescript-eslint/ban-ts-comment: "off" */
    // @ts-ignore-next-line no-implicit-any error
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
      const withSkippedPubkeyAmountBuilder = lightningBuilder.withInvoice(
        skippedPubkeyInvoiceWithAmount,
      )
      const withSkippedChanIdAmountBuilder = lightningBuilder.withInvoice(
        skippedChanIdInvoiceWithAmount,
      )
      // @ts-ignore-next-line no-implicit-any error
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
          .withSenderWallet(senderBtcWalletDescriptor)
          .withoutRecipientWallet()

        const withSkippedPubkeyBtcWalletBuilder = withSkippedPubkeyAmountBuilder
          .withSenderWallet(senderBtcWalletDescriptor)
          .withoutRecipientWallet()

        const withSkippedChanIdBtcWalletBuilder = withSkippedChanIdAmountBuilder
          .withSenderWallet(senderBtcWalletDescriptor)
          .withoutRecipientWallet()

        // @ts-ignore-next-line no-implicit-any error
        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderBtcWalletDescriptor.id,
              senderWalletCurrency: senderBtcWalletDescriptor.currency,
            }),
          )
        }

        it("sets 'skipProbe' property to true for skipProbe destination invoice", async () => {
          const skippedPubkeyBuilder =
            await withSkippedPubkeyBtcWalletBuilder.withConversion({
              mid,
              hedgeBuyUsd,
              hedgeSellUsd,
            })
          expect(skippedPubkeyBuilder.skipProbeForDestination()).toBeTruthy()

          const skippedChanIdBuilder =
            await withSkippedChanIdBtcWalletBuilder.withConversion({
              mid,
              hedgeBuyUsd,
              hedgeSellUsd,
            })
          expect(skippedChanIdBuilder.skipProbeForDestination()).toBeTruthy()
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

          const btcProtocolAndBankFee = LnFees().maxProtocolAndBankFee(
            invoiceWithAmount.paymentAmount,
          )
          if (btcProtocolAndBankFee instanceof Error) return btcProtocolAndBankFee
          expect(btcProtocolAndBankFee).not.toBeInstanceOf(Error)

          const priceRatio = WalletPriceRatio(payment.paymentAmounts())
          if (priceRatio instanceof Error) throw priceRatio
          const usdProtocolAndBankFee =
            priceRatio.convertFromBtcToCeil(btcProtocolAndBankFee)

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              usdPaymentAmount,
              btcProtocolAndBankFee,
              usdProtocolAndBankFee,
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

          const btcProtocolAndBankFee = LnFees().feeFromRawRoute(rawRoute)
          if (btcProtocolAndBankFee instanceof Error) return btcProtocolAndBankFee
          expect(btcProtocolAndBankFee).not.toBeInstanceOf(Error)

          const priceRatio = WalletPriceRatio(payment.paymentAmounts())
          if (priceRatio instanceof Error) throw priceRatio

          expect(payment).toEqual(
            expect.objectContaining({
              btcProtocolAndBankFee,
              usdProtocolAndBankFee:
                priceRatio.convertFromBtcToCeil(btcProtocolAndBankFee),
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
          .withSenderWallet(senderUsdWalletDescriptor)
          .withoutRecipientWallet()

        // @ts-ignore-next-line no-implicit-any error
        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderUsdWalletDescriptor.id,
              senderWalletCurrency: senderUsdWalletDescriptor.currency,
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

          const btcProtocolAndBankFee = LnFees().maxProtocolAndBankFee(
            invoiceWithAmount.paymentAmount,
          )
          if (btcProtocolAndBankFee instanceof Error) return btcProtocolAndBankFee
          expect(btcProtocolAndBankFee).not.toBeInstanceOf(Error)

          const usdProtocolAndBankFee = await usdFromBtcSell(btcProtocolAndBankFee)

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              usdPaymentAmount,
              btcProtocolAndBankFee,
              usdProtocolAndBankFee,
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

          const btcProtocolAndBankFee = LnFees().feeFromRawRoute(rawRoute)
          if (btcProtocolAndBankFee instanceof Error) return btcProtocolAndBankFee
          expect(btcProtocolAndBankFee).not.toBeInstanceOf(Error)

          expect(payment).toEqual(
            expect.objectContaining({
              btcProtocolAndBankFee,
              usdProtocolAndBankFee: await usdFromBtcSell(btcProtocolAndBankFee),
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
      // @ts-ignore-next-line no-implicit-any error
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
          .withSenderWallet(senderBtcWalletDescriptor)
          .withoutRecipientWallet()

        // @ts-ignore-next-line no-implicit-any error
        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderBtcWalletDescriptor.id,
              senderWalletCurrency: senderBtcWalletDescriptor.currency,
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

          const btcProtocolAndBankFee = LnFees().maxProtocolAndBankFee({
            amount: uncheckedAmount,
            currency: WalletCurrency.Btc,
          })
          if (btcProtocolAndBankFee instanceof Error) return btcProtocolAndBankFee
          expect(btcProtocolAndBankFee).not.toBeInstanceOf(Error)

          const priceRatio = WalletPriceRatio(payment.paymentAmounts())
          if (priceRatio instanceof Error) throw priceRatio
          const usdProtocolAndBankFee =
            priceRatio.convertFromBtcToCeil(btcProtocolAndBankFee)

          checkSettlementMethod(payment)
          checkInvoice(payment)
          checkSenderWallet(payment)
          expect(payment).toEqual(
            expect.objectContaining({
              usdPaymentAmount,
              btcProtocolAndBankFee,
              usdProtocolAndBankFee,
              skipProbeForDestination: false,
            }),
          )
        })
      })

      describe("with usd wallet", () => {
        const withUsdWalletBuilder = withAmountBuilder
          .withSenderWallet(senderUsdWalletDescriptor)
          .withoutRecipientWallet()

        // @ts-ignore-next-line no-implicit-any error
        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderUsdWalletDescriptor.id,
              senderWalletCurrency: senderUsdWalletDescriptor.currency,
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
              btcProtocolAndBankFee: LnFees().maxProtocolAndBankFee(btcPaymentAmount),
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
      skipProbe,
    })

    // @ts-ignore-next-line no-implicit-any error
    const checkSettlementMethod = (payment) => {
      expect(payment).toEqual(
        expect.objectContaining({
          settlementMethod: SettlementMethod.IntraLedger,
          paymentInitiationMethod: PaymentInitiationMethod.Lightning,
          btcProtocolAndBankFee: LnFees().intraLedgerFees().btc,
          usdProtocolAndBankFee: LnFees().intraLedgerFees().usd,
        }),
      )
    }
    describe("invoice with amount", () => {
      const withAmountBuilder = intraledgerBuilder.withInvoice(invoiceWithAmount)

      // @ts-ignore-next-line no-implicit-any error
      const checkInvoice = (payment) => {
        expect(payment).toEqual(
          expect.objectContaining({
            btcPaymentAmount: invoiceWithAmount.paymentAmount,
            inputAmount: invoiceWithAmount.paymentAmount?.amount,
          }),
        )
      }
      describe("with btc wallet", () => {
        const withBtcWalletBuilder = withAmountBuilder.withSenderWallet(
          senderBtcWalletDescriptor,
        )

        // @ts-ignore-next-line no-implicit-any error
        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderBtcWalletDescriptor.id,
              senderWalletCurrency: senderBtcWalletDescriptor.currency,
            }),
          )
        }

        describe("with btc recipient", () => {
          const withBtcRecipientBuilder =
            withBtcWalletBuilder.withRecipientWallet(recipientBtcArgs)

          // @ts-ignore-next-line no-implicit-any error
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientBtcWalletDescriptor.id,
                recipientWalletCurrency: recipientBtcWalletDescriptor.currency,
                recipientUsername: recipientBtcArgs.username,
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
            ...recipientUsdArgs,
            usdPaymentAmount,
          })

          // @ts-ignore-next-line no-implicit-any error
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientUsdWalletDescriptor.id,
                recipientWalletCurrency: recipientUsdWalletDescriptor.currency,
                recipientUsername: recipientUsdArgs.username,
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
        const withUsdWalletBuilder = withAmountBuilder.withSenderWallet(
          senderUsdWalletDescriptor,
        )

        // @ts-ignore-next-line no-implicit-any error
        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderUsdWalletDescriptor.id,
              senderWalletCurrency: senderUsdWalletDescriptor.currency,
            }),
          )
        }

        describe("with btc recipient", () => {
          const withBtcRecipientBuilder =
            withUsdWalletBuilder.withRecipientWallet(recipientBtcArgs)

          // @ts-ignore-next-line no-implicit-any error
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientBtcWalletDescriptor.id,
                recipientWalletCurrency: recipientBtcWalletDescriptor.currency,
                recipientUsername: recipientBtcArgs.username,
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
            ...recipientUsdArgs,
            usdPaymentAmount,
          })

          // @ts-ignore-next-line no-implicit-any error
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientUsdWalletDescriptor.id,
                recipientWalletCurrency: recipientUsdWalletDescriptor.currency,
                recipientUsername: recipientUsdArgs.username,
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

      const lessThan1CentAmount = 1n
      const lessThan1CentWithAmountBuilder = intraledgerBuilder.withNoAmountInvoice({
        invoice: invoiceWithNoAmount,
        uncheckedAmount: Number(lessThan1CentAmount),
      })

      // @ts-ignore-next-line no-implicit-any error
      const checkInvoice = (payment) => {
        expect(payment).toEqual(
          expect.objectContaining({
            inputAmount: uncheckedAmount,
          }),
        )
      }

      describe("with btc wallet", () => {
        const withBtcWalletBuilder = withAmountBuilder.withSenderWallet(
          senderBtcWalletDescriptor,
        )
        const lessThan1CentWithBtcWalletBuilder =
          lessThan1CentWithAmountBuilder.withSenderWallet(senderBtcWalletDescriptor)

        // @ts-ignore-next-line no-implicit-any error
        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderBtcWalletDescriptor.id,
              senderWalletCurrency: senderBtcWalletDescriptor.currency,
              btcPaymentAmount: {
                amount: uncheckedAmount,
                currency: WalletCurrency.Btc,
              },
            }),
          )
        }

        describe("with btc recipient", () => {
          const withBtcRecipientBuilder =
            withBtcWalletBuilder.withRecipientWallet(recipientBtcArgs)
          const lessThan1CentWithBtcRecipientBuilder =
            lessThan1CentWithBtcWalletBuilder.withRecipientWallet(recipientBtcArgs)

          // @ts-ignore-next-line no-implicit-any error
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientBtcWalletDescriptor.id,
                recipientWalletCurrency: recipientBtcWalletDescriptor.currency,
                recipientUsername: recipientBtcArgs.username,
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

          it("sends amount less than 1 cent", async () => {
            const paymentBefore = lessThan1CentWithBtcRecipientBuilder.withConversion({
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
            const payment = await paymentBefore.withoutRoute()
            if (payment instanceof Error) throw payment

            checkSettlementMethod(payment)
            expect(payment).toEqual(
              expect.objectContaining({
                usdPaymentAmount: ONE_CENT,
              }),
            )
          })
        })

        describe("with usd recipient", () => {
          const withUsdRecipientBuilder =
            withBtcWalletBuilder.withRecipientWallet(recipientUsdArgs)

          const lessThan1CentWithUsdRecipientBuilder =
            lessThan1CentWithBtcWalletBuilder.withRecipientWallet(recipientUsdArgs)

          const lessThan1CentWithSelfUsdRecipientBuilder =
            lessThan1CentWithBtcWalletBuilder.withRecipientWallet(
              senderUsdAsRecipientArgs,
            )

          // @ts-ignore-next-line no-implicit-any error
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientUsdWalletDescriptor.id,
                recipientWalletCurrency: recipientUsdWalletDescriptor.currency,
                recipientUsername: recipientUsdArgs.username,
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

          it("credits amount less than 1 cent amount to recipient btc wallet", async () => {
            const paymentFlow = await lessThan1CentWithUsdRecipientBuilder
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
            if (paymentFlow instanceof Error) throw paymentFlow

            const { walletDescriptor: recipientWalletDescriptor } =
              paymentFlow.recipientDetails()
            expect(recipientWalletDescriptor).toStrictEqual(recipientBtcWalletDescriptor)
          })

          it("fails to send less than 1 cent to self", async () => {
            const paymentFlow = await lessThan1CentWithSelfUsdRecipientBuilder
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
            expect(paymentFlow).toBeInstanceOf(SubOneCentSatAmountForUsdSelfSendError)
          })
        })
      })

      describe("with usd wallet", () => {
        const withUsdWalletBuilder = withAmountBuilder.withSenderWallet(
          senderUsdWalletDescriptor,
        )

        // @ts-ignore-next-line no-implicit-any error
        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderUsdWalletDescriptor.id,
              senderWalletCurrency: senderUsdWalletDescriptor.currency,
              usdPaymentAmount: {
                amount: uncheckedAmount,
                currency: WalletCurrency.Usd,
              },
            }),
          )
        }

        describe("with btc recipient", () => {
          const withBtcRecipientBuilder =
            withUsdWalletBuilder.withRecipientWallet(recipientBtcArgs)

          // @ts-ignore-next-line no-implicit-any error
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientBtcWalletDescriptor.id,
                recipientWalletCurrency: recipientBtcWalletDescriptor.currency,
                recipientUsername: recipientBtcArgs.username,
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
            withUsdWalletBuilder.withRecipientWallet(recipientUsdArgs)

          // @ts-ignore-next-line no-implicit-any error
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientUsdWalletDescriptor.id,
                recipientWalletCurrency: recipientUsdWalletDescriptor.currency,
                recipientUsername: recipientUsdArgs.username,
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
      skipProbe,
    })

    // @ts-ignore-next-line no-implicit-any error
    const checkSettlementMethod = (payment) => {
      expect(payment).toEqual(
        expect.objectContaining({
          settlementMethod: SettlementMethod.IntraLedger,
          paymentInitiationMethod: PaymentInitiationMethod.IntraLedger,
          btcProtocolAndBankFee: LnFees().intraLedgerFees().btc,
          usdProtocolAndBankFee: LnFees().intraLedgerFees().usd,
        }),
      )
    }
    describe("no invoice", () => {
      const uncheckedAmount = 10000n
      const withAmountBuilder = intraledgerBuilder.withoutInvoice({
        uncheckedAmount: Number(uncheckedAmount),
        description: "",
      })

      const lessThan1CentAmount = 1n
      const lessThan1CentWithAmountBuilder = intraledgerBuilder.withoutInvoice({
        uncheckedAmount: Number(lessThan1CentAmount),
        description: "",
      })

      // @ts-ignore-next-line no-implicit-any error
      const checkInvoice = (payment) => {
        expect(payment).toEqual(
          expect.objectContaining({
            inputAmount: uncheckedAmount,
          }),
        )
      }

      describe("with btc wallet", () => {
        const withBtcWalletBuilder = withAmountBuilder.withSenderWallet(
          senderBtcWalletDescriptor,
        )
        const lessThan1CentWithBtcWalletBuilder =
          lessThan1CentWithAmountBuilder.withSenderWallet(senderBtcWalletDescriptor)

        // @ts-ignore-next-line no-implicit-any error
        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderBtcWalletDescriptor.id,
              senderWalletCurrency: senderBtcWalletDescriptor.currency,
              btcPaymentAmount: {
                amount: uncheckedAmount,
                currency: WalletCurrency.Btc,
              },
            }),
          )
        }

        describe("with btc recipient", () => {
          const withBtcRecipientBuilder =
            withBtcWalletBuilder.withRecipientWallet(recipientBtcArgs)

          const lessThan1CentWithBtcRecipientBuilder =
            lessThan1CentWithBtcWalletBuilder.withRecipientWallet(recipientBtcArgs)

          // @ts-ignore-next-line no-implicit-any error
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientBtcWalletDescriptor.id,
                recipientWalletCurrency: recipientBtcWalletDescriptor.currency,
                recipientUsername: recipientBtcArgs.username,
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

          it("sends amount less than 1 cent", async () => {
            const paymentBefore = lessThan1CentWithBtcRecipientBuilder.withConversion({
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
            const payment = await paymentBefore.withoutRoute()
            if (payment instanceof Error) throw payment

            checkSettlementMethod(payment)
            expect(payment).toEqual(
              expect.objectContaining({
                usdPaymentAmount: ONE_CENT,
              }),
            )
          })
        })

        describe("with usd recipient", () => {
          const withUsdRecipientBuilder =
            withBtcWalletBuilder.withRecipientWallet(recipientUsdArgs)

          const lessThan1CentWithUsdRecipientBuilder =
            lessThan1CentWithBtcWalletBuilder.withRecipientWallet(recipientUsdArgs)

          const lessThan1CentWithSelfUsdRecipientBuilder =
            lessThan1CentWithBtcWalletBuilder.withRecipientWallet(
              senderUsdAsRecipientArgs,
            )

          // @ts-ignore-next-line no-implicit-any error
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientUsdWalletDescriptor.id,
                recipientWalletCurrency: recipientUsdWalletDescriptor.currency,
                recipientUsername: recipientUsdArgs.username,
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

          it("credits amount less than 1 cent amount to recipient btc wallet", async () => {
            const paymentFlow = await lessThan1CentWithUsdRecipientBuilder
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
            if (paymentFlow instanceof Error) throw paymentFlow

            const { walletDescriptor: recipientWalletDescriptor } =
              paymentFlow.recipientDetails()
            expect(recipientWalletDescriptor).toStrictEqual(recipientBtcWalletDescriptor)
          })

          it("fails to send amount less than 1 cent to self", async () => {
            const payment = await lessThan1CentWithSelfUsdRecipientBuilder
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
            expect(payment).toBeInstanceOf(SubOneCentSatAmountForUsdSelfSendError)
          })
        })
      })

      describe("with usd wallet", () => {
        const withUsdWalletBuilder = withAmountBuilder.withSenderWallet(
          senderUsdWalletDescriptor,
        )

        // @ts-ignore-next-line no-implicit-any error
        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderUsdWalletDescriptor.id,
              senderWalletCurrency: senderUsdWalletDescriptor.currency,
              usdPaymentAmount: {
                amount: uncheckedAmount,
                currency: WalletCurrency.Usd,
              },
            }),
          )
        }

        describe("with btc recipient", () => {
          const withBtcRecipientBuilder =
            withUsdWalletBuilder.withRecipientWallet(recipientBtcArgs)

          // @ts-ignore-next-line no-implicit-any error
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientBtcWalletDescriptor.id,
                recipientWalletCurrency: recipientBtcWalletDescriptor.currency,
                recipientUsername: recipientBtcArgs.username,
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
            withUsdWalletBuilder.withRecipientWallet(recipientUsdArgs)

          // @ts-ignore-next-line no-implicit-any error
          const checkRecipientWallet = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                recipientWalletId: recipientUsdWalletDescriptor.id,
                recipientWalletCurrency: recipientUsdWalletDescriptor.currency,
                recipientUsername: recipientUsdArgs.username,
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
          skipProbe,
        })
          .withInvoice(invoiceWithNoAmount)
          .withSenderWallet(senderBtcWalletDescriptor)
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
          skipProbe,
        })
          .withNoAmountInvoice({ invoice: invoiceWithNoAmount, uncheckedAmount: 0.4 })
          .withSenderWallet(senderBtcWalletDescriptor)
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
          skipProbe,
        })
          .withNoAmountInvoice({ invoice: invoiceWithNoAmount, uncheckedAmount: 0 })
          .withSenderWallet(senderBtcWalletDescriptor)
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
          skipProbe,
        })
          .withInvoice(invoiceWithAmount)
          .withSenderWallet(senderBtcWalletDescriptor)
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
          skipProbe,
        })
          .withInvoice(invoiceWithAmount)
          .withSenderWallet(senderBtcWalletDescriptor)
          .withRecipientWallet(senderUsdAsRecipientArgs)
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
          skipProbe,
        })
          .withNoAmountInvoice({ invoice: invoiceWithNoAmount, uncheckedAmount: 1000 })
          .withSenderWallet(senderBtcWalletDescriptor)
          .withRecipientWallet({
            ...senderUsdAsRecipientArgs,
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
          skipProbe,
        })
          .withInvoice(invoiceWithAmount)
          .withSenderWallet(senderBtcWalletDescriptor)
          .withRecipientWallet(senderBtcAsRecipientArgs)
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
