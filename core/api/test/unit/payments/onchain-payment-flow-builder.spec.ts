import { getFeesConfig, getOnChainWalletConfig } from "@/config"

import { SettlementMethod, PaymentInitiationMethod, OnChainFees } from "@/domain/wallets"
import { LessThanDustThresholdError, SelfPaymentError } from "@/domain/errors"
import {
  InvalidOnChainPaymentFlowBuilderStateError,
  SubOneCentSatAmountForUsdSelfSendError,
  WalletPriceRatio,
} from "@/domain/payments"
import {
  BtcPaymentAmount,
  ONE_CENT,
  paymentAmountFromNumber,
  ValidationError,
  WalletCurrency,
} from "@/domain/shared"
import { OnChainPaymentFlowBuilder } from "@/domain/payments/onchain-payment-flow-builder"
import { toSats } from "@/domain/bitcoin"
import { ImbalanceCalculator } from "@/domain/ledger/imbalance-calculator"

const feeConfig = getFeesConfig()
const { dustThreshold } = getOnChainWalletConfig()

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

describe("OnChainPaymentFlowBuilder", () => {
  const address = "address" as OnChainAddress
  const uncheckedAmount = 10000
  const dustAmount = dustThreshold - 1

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

  const senderAccount = { withdrawFee: toSats(100) } as Account

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

  // 0.02 ratio (0.02 cents/sat, or $20,000 USD/BTC)
  const midPriceRatio = 0.02
  const immediateSpread = 0.001 // 0.10 %
  // const futureSpread = 0.0012 // 0.12%

  const centsFromSats = ({ sats, spread, round }: ConversionBtc): bigint =>
    BigInt(round(sats * midPriceRatio * spread))
  const satsFromCents = ({ cents, spread, round }: ConversionUsd): bigint =>
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

  const withConversionArgs = {
    mid,
    hedgeBuyUsd,
    hedgeSellUsd,
  }

  const volumeAmountLightningFn = async <S extends WalletCurrency>() =>
    Promise.resolve({
      outgoingBaseAmount: BtcPaymentAmount(1000n) as PaymentAmount<S>,
      incomingBaseAmount: BtcPaymentAmount(1000n) as PaymentAmount<S>,
    })

  const volumeAmountOnChainFn = async <S extends WalletCurrency>() =>
    Promise.resolve({
      outgoingBaseAmount: BtcPaymentAmount(1000n) as PaymentAmount<S>,
      incomingBaseAmount: BtcPaymentAmount(1000n) as PaymentAmount<S>,
    })

  describe("onchain initiated", () => {
    const onChainBuilder = OnChainPaymentFlowBuilder({
      volumeAmountLightningFn,
      volumeAmountOnChainFn,
      isExternalAddress: async (state) =>
        /* eslint @typescript-eslint/ban-ts-comment: "off" */
        // @ts-ignore-next-line error
        Promise.resolve(!state.recipientWalletId),
      sendAll: false,
      dustThreshold,
    })

    describe("with address", () => {
      const withAddressBuilder = onChainBuilder.withAddress(address)

      /* eslint @typescript-eslint/ban-ts-comment: "off" */
      // @ts-ignore-next-line no-implicit-any error
      const checkAddress = (payment) => {
        expect(payment).toEqual(
          expect.objectContaining({
            address,
          }),
        )
      }

      describe("with btc wallet", () => {
        const withBtcWalletBuilder = withAddressBuilder.withSenderWalletAndAccount({
          wallet: senderBtcWalletDescriptor,
          account: senderAccount,
        })

        // @ts-ignore-next-line no-implicit-any error
        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderBtcWalletDescriptor.id,
              senderWalletCurrency: senderBtcWalletDescriptor.currency,
              senderWithdrawFee: senderAccount.withdrawFee,
            }),
          )
        }

        const thresholdImbalanceAmount = paymentAmountFromNumber({
          amount: feeConfig.withdrawThreshold,
          currency: WalletCurrency.Btc,
        })
        if (thresholdImbalanceAmount instanceof Error) throw thresholdImbalanceAmount

        const onChainFees = OnChainFees({
          feeRatioAsBasisPoints: feeConfig.withdrawRatioAsBasisPoints,
          thresholdImbalance: thresholdImbalanceAmount,
        })

        const amountCurrency = WalletCurrency.Btc
        describe("onchain settled", () => {
          // @ts-ignore-next-line no-implicit-any error
          const checkSettlementMethod = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                settlementMethod: SettlementMethod.OnChain,
                paymentInitiationMethod: PaymentInitiationMethod.OnChain,
              }),
            )
          }
          describe("without recipient wallet", () => {
            const convertForBtcWalletToBtcAddress = mid

            describe("with amount", () => {
              const withAmountBuilder = withBtcWalletBuilder
                .withoutRecipientWallet()
                .withAmount({ amount: BigInt(uncheckedAmount), currency: amountCurrency })

              // @ts-ignore-next-line no-implicit-any error
              const checkInputAmount = (payment) => {
                expect(payment).toEqual(
                  expect.objectContaining({
                    inputAmount: BigInt(uncheckedAmount),
                  }),
                )
              }

              it("correctly applies miner, bank and imbalance fees", async () => {
                const minerFee = { amount: 300n, currency: WalletCurrency.Btc }
                const payment = await withAmountBuilder
                  .withConversion(withConversionArgs)
                  .withMinerFee(minerFee)
                if (payment instanceof Error) throw payment

                const btcPaymentAmount = {
                  amount: BigInt(uncheckedAmount),
                  currency: WalletCurrency.Btc,
                }

                const usdPaymentAmount =
                  await convertForBtcWalletToBtcAddress.usdFromBtc(btcPaymentAmount)

                const sendAmount = paymentAmountFromNumber({
                  amount: uncheckedAmount,
                  currency: WalletCurrency.Btc,
                })
                if (sendAmount instanceof Error) throw sendAmount

                const minBankFee = paymentAmountFromNumber({
                  amount: senderAccount.withdrawFee as Satoshis,
                  currency: WalletCurrency.Btc,
                })
                if (minBankFee instanceof Error) throw minBankFee

                const imbalanceCalculator = ImbalanceCalculator({
                  method: feeConfig.withdrawMethod,
                  volumeAmountLightningFn,
                  volumeAmountOnChainFn,
                  sinceDaysAgo: feeConfig.withdrawDaysLookback,
                })
                const imbalance = await imbalanceCalculator.getSwapOutImbalanceAmount(
                  senderBtcWalletDescriptor,
                )
                if (imbalance instanceof Error) throw imbalance

                const withdrawFees = onChainFees.withdrawalFee({
                  minerFee,
                  amount: sendAmount,
                  minBankFee,
                  imbalance,
                })
                if (withdrawFees instanceof Error) throw withdrawFees

                const walletPriceRatio = WalletPriceRatio({
                  usd: usdPaymentAmount,
                  btc: btcPaymentAmount,
                })
                if (walletPriceRatio instanceof Error) throw walletPriceRatio

                const btcProtocolAndBankFee = withdrawFees.totalFee
                const usdProtocolAndBankFee =
                  await walletPriceRatio.convertFromBtcToCeil(btcProtocolAndBankFee)

                checkAddress(payment)
                checkSettlementMethod(payment)
                checkInputAmount(payment)
                checkSenderWallet(payment)
                expect(payment).toEqual(
                  expect.objectContaining({
                    btcPaymentAmount,
                    usdPaymentAmount,
                    btcProtocolAndBankFee,
                    usdProtocolAndBankFee,
                  }),
                )
              })
            })

            describe("with dust amount", () => {
              it("correctly returns dust error", async () => {
                const minerFee = { amount: 300n, currency: WalletCurrency.Btc }

                const paymentLowest = await withBtcWalletBuilder
                  .withoutRecipientWallet()
                  .withAmount({ amount: BigInt(51), currency: amountCurrency }) // Close to 1 cent
                  .withConversion(withConversionArgs)
                  .withMinerFee(minerFee)
                expect(paymentLowest).toBeInstanceOf(LessThanDustThresholdError)

                const paymentBelow = await withBtcWalletBuilder
                  .withoutRecipientWallet()
                  .withAmount({ amount: BigInt(dustAmount), currency: amountCurrency })
                  .withConversion(withConversionArgs)
                  .withMinerFee(minerFee)
                expect(paymentBelow).toBeInstanceOf(LessThanDustThresholdError)

                const paymentAbove = await withBtcWalletBuilder
                  .withoutRecipientWallet()
                  .withAmount({
                    amount: BigInt(dustAmount + 1),
                    currency: amountCurrency,
                  })
                  .withConversion(withConversionArgs)
                  .withMinerFee(minerFee)
                expect(paymentAbove).not.toBeInstanceOf(Error)
              })
            })
          })
        })

        describe("intraledger settled", () => {
          // @ts-ignore-next-line no-implicit-any error
          const checkSettlementMethod = (payment) => {
            expect(payment).toEqual(
              expect.objectContaining({
                settlementMethod: SettlementMethod.IntraLedger,
                paymentInitiationMethod: PaymentInitiationMethod.OnChain,
                btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
                usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
              }),
            )
          }

          describe("with btc recipient wallet", () => {
            const convertForBtcWalletToBtcWallet = mid

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

            const withBtcRecipientBuilder =
              withBtcWalletBuilder.withRecipientWallet(recipientBtcArgs)

            it("correctly applies no fees, with normal amount", async () => {
              const amount = uncheckedAmount
              const withAmountBuilder = withBtcRecipientBuilder.withAmount({
                amount: BigInt(amount),
                currency: amountCurrency,
              })

              // @ts-ignore-next-line no-implicit-any error
              const checkInputAmount = (payment) => {
                expect(payment).toEqual(
                  expect.objectContaining({
                    inputAmount: BigInt(amount),
                  }),
                )
              }

              const payment = await withAmountBuilder
                .withConversion(withConversionArgs)
                .withoutMinerFee()
              if (payment instanceof Error) throw payment

              const btcPaymentAmount = {
                amount: BigInt(amount),
                currency: WalletCurrency.Btc,
              }
              const usdPaymentAmount =
                await convertForBtcWalletToBtcWallet.usdFromBtc(btcPaymentAmount)

              checkAddress(payment)
              checkSettlementMethod(payment)
              checkInputAmount(payment)
              checkSenderWallet(payment)
              checkRecipientWallet(payment)
              expect(payment).toEqual(
                expect.objectContaining({
                  btcPaymentAmount,
                  usdPaymentAmount,
                  btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
                  usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
                }),
              )
            })

            it("correctly applies no fees, with dust amount", async () => {
              const amount = dustAmount
              const withAmountBuilder = withBtcRecipientBuilder.withAmount({
                amount: BigInt(amount),
                currency: amountCurrency,
              })

              // @ts-ignore-next-line no-implicit-any error
              const checkInputAmount = (payment) => {
                expect(payment).toEqual(
                  expect.objectContaining({
                    inputAmount: BigInt(amount),
                  }),
                )
              }

              const payment = await withAmountBuilder
                .withConversion(withConversionArgs)
                .withoutMinerFee()
              if (payment instanceof Error) throw payment

              const btcPaymentAmount = {
                amount: BigInt(amount),
                currency: WalletCurrency.Btc,
              }
              const usdPaymentAmount =
                await convertForBtcWalletToBtcWallet.usdFromBtc(btcPaymentAmount)

              checkAddress(payment)
              checkSettlementMethod(payment)
              checkInputAmount(payment)
              checkSenderWallet(payment)
              checkRecipientWallet(payment)
              expect(payment).toEqual(
                expect.objectContaining({
                  btcPaymentAmount,
                  usdPaymentAmount,
                  btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
                  usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
                }),
              )
            })

            it("correctly applies no fees, with min amount", async () => {
              const amount = 51 // Close to 1 cent
              const withAmountBuilder = withBtcRecipientBuilder.withAmount({
                amount: BigInt(amount),
                currency: amountCurrency,
              })

              // @ts-ignore-next-line no-implicit-any error
              const checkInputAmount = (payment) => {
                expect(payment).toEqual(
                  expect.objectContaining({
                    inputAmount: BigInt(amount),
                  }),
                )
              }

              const payment = await withAmountBuilder
                .withConversion(withConversionArgs)
                .withoutMinerFee()
              if (payment instanceof Error) throw payment

              const btcPaymentAmount = {
                amount: BigInt(amount),
                currency: WalletCurrency.Btc,
              }
              const usdPaymentAmount =
                await convertForBtcWalletToBtcWallet.usdFromBtc(btcPaymentAmount)

              checkAddress(payment)
              checkSettlementMethod(payment)
              checkInputAmount(payment)
              checkSenderWallet(payment)
              checkRecipientWallet(payment)
              expect(payment).toEqual(
                expect.objectContaining({
                  btcPaymentAmount,
                  usdPaymentAmount,
                  btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
                  usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
                }),
              )
            })
          })

          describe("with usd recipient wallet", () => {
            const convertForBtcWalletToUsdWallet = hedgeBuyUsd

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

            const withUsdRecipientBuilder =
              withBtcWalletBuilder.withRecipientWallet(recipientUsdArgs)

            const lessThan1CentWithUsdRecipientBuilder =
              withBtcWalletBuilder.withRecipientWallet(recipientUsdArgs)

            const lessThan1CentWithSelfUsdRecipientBuilder =
              withBtcWalletBuilder.withRecipientWallet(senderUsdAsRecipientArgs)

            it("correctly applies no fees, with normal amount", async () => {
              const amount = uncheckedAmount
              const withAmountBuilder = withUsdRecipientBuilder.withAmount({
                amount: BigInt(amount),
                currency: amountCurrency,
              })

              // @ts-ignore-next-line no-implicit-any error
              const checkInputAmount = (payment) => {
                expect(payment).toEqual(
                  expect.objectContaining({
                    inputAmount: BigInt(amount),
                  }),
                )
              }

              const payment = await withAmountBuilder
                .withConversion(withConversionArgs)
                .withoutMinerFee()
              if (payment instanceof Error) throw payment

              const btcPaymentAmount = {
                amount: BigInt(amount),
                currency: WalletCurrency.Btc,
              }
              const usdPaymentAmount =
                await convertForBtcWalletToUsdWallet.usdFromBtc(btcPaymentAmount)

              checkAddress(payment)
              checkSettlementMethod(payment)
              checkInputAmount(payment)
              checkSenderWallet(payment)
              checkRecipientWallet(payment)
              expect(payment).toEqual(
                expect.objectContaining({
                  btcPaymentAmount,
                  usdPaymentAmount,
                  btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
                  usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
                }),
              )
            })

            it("correctly applies no fees, with dust amount", async () => {
              const amount = dustAmount
              const withAmountBuilder = withUsdRecipientBuilder.withAmount({
                amount: BigInt(amount),
                currency: amountCurrency,
              })

              // @ts-ignore-next-line no-implicit-any error
              const checkInputAmount = (payment) => {
                expect(payment).toEqual(
                  expect.objectContaining({
                    inputAmount: BigInt(amount),
                  }),
                )
              }

              const payment = await withAmountBuilder
                .withConversion(withConversionArgs)
                .withoutMinerFee()
              if (payment instanceof Error) throw payment

              const btcPaymentAmount = {
                amount: BigInt(amount),
                currency: WalletCurrency.Btc,
              }
              const usdPaymentAmount =
                await convertForBtcWalletToUsdWallet.usdFromBtc(btcPaymentAmount)

              checkAddress(payment)
              checkSettlementMethod(payment)
              checkInputAmount(payment)
              checkSenderWallet(payment)
              checkRecipientWallet(payment)
              expect(payment).toEqual(
                expect.objectContaining({
                  btcPaymentAmount,
                  usdPaymentAmount,
                  btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
                  usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
                }),
              )
            })

            it("correctly applies no fees, with min amount", async () => {
              const amount = 51 // Close to 1 cent
              const withAmountBuilder = withUsdRecipientBuilder.withAmount({
                amount: BigInt(amount),
                currency: amountCurrency,
              })

              // @ts-ignore-next-line no-implicit-any error
              const checkInputAmount = (payment) => {
                expect(payment).toEqual(
                  expect.objectContaining({
                    inputAmount: BigInt(amount),
                  }),
                )
              }

              const payment = await withAmountBuilder
                .withConversion(withConversionArgs)
                .withoutMinerFee()
              if (payment instanceof Error) throw payment

              const btcPaymentAmount = {
                amount: BigInt(amount),
                currency: WalletCurrency.Btc,
              }
              const usdPaymentAmount =
                await convertForBtcWalletToUsdWallet.usdFromBtc(btcPaymentAmount)

              checkAddress(payment)
              checkSettlementMethod(payment)
              checkInputAmount(payment)
              checkSenderWallet(payment)
              checkRecipientWallet(payment)
              expect(payment).toEqual(
                expect.objectContaining({
                  btcPaymentAmount,
                  usdPaymentAmount,
                  btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
                  usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
                }),
              )
            })

            it("credits amount less than 1 cent amount to recipient btc wallet", async () => {
              const amount = 1
              const paymentFlow = await lessThan1CentWithUsdRecipientBuilder
                .withAmount({
                  amount: BigInt(amount),
                  currency: amountCurrency,
                })
                .withConversion(withConversionArgs)
                .withoutMinerFee()
              if (paymentFlow instanceof Error) throw paymentFlow

              const { walletDescriptor: recipientWalletDescriptor } =
                paymentFlow.recipientDetails()
              expect(recipientWalletDescriptor).toStrictEqual(
                recipientBtcWalletDescriptor,
              )
            })

            it("fails to send less than 1 cent to self", async () => {
              const amount = 1
              const paymentFlow = await lessThan1CentWithSelfUsdRecipientBuilder
                .withAmount({
                  amount: BigInt(amount),
                  currency: amountCurrency,
                })
                .withConversion(withConversionArgs)
                .withoutMinerFee()
              expect(paymentFlow).toBeInstanceOf(SubOneCentSatAmountForUsdSelfSendError)
            })
          })
        })
      })

      describe("with usd wallet", () => {
        const withUsdWalletBuilder = withAddressBuilder.withSenderWalletAndAccount({
          wallet: senderUsdWalletDescriptor,
          account: senderAccount,
        })

        // @ts-ignore-next-line no-implicit-any error
        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderUsdWalletDescriptor.id,
              senderWalletCurrency: senderUsdWalletDescriptor.currency,
              senderWithdrawFee: senderAccount.withdrawFee,
            }),
          )
        }

        const thresholdImbalanceAmount = paymentAmountFromNumber({
          amount: feeConfig.withdrawThreshold,
          currency: WalletCurrency.Btc,
        })
        if (thresholdImbalanceAmount instanceof Error) throw thresholdImbalanceAmount

        const onChainFees = OnChainFees({
          feeRatioAsBasisPoints: feeConfig.withdrawRatioAsBasisPoints,
          thresholdImbalance: thresholdImbalanceAmount,
        })

        const amountCurrencyCases = [
          { amountCurrency: WalletCurrency.Usd, uncheckedAmount: 10_000 },
          { amountCurrency: WalletCurrency.Btc, uncheckedAmount: 499_500 },
        ]
        for (const { amountCurrency, uncheckedAmount } of amountCurrencyCases) {
          describe(`${amountCurrency.toLowerCase()} send amount`, () => {
            describe("onchain settled", () => {
              // @ts-ignore-next-line no-implicit-any error
              const checkSettlementMethod = (payment) => {
                expect(payment).toEqual(
                  expect.objectContaining({
                    settlementMethod: SettlementMethod.OnChain,
                    paymentInitiationMethod: PaymentInitiationMethod.OnChain,
                  }),
                )
              }

              describe("without recipient wallet", () => {
                const convertForUsdWalletToBtcAddress = hedgeSellUsd
                const convertReverseForUsdWalletToBtcAddress = mid // an approximation to reverse functions

                describe("with amount", () => {
                  const withAmountBuilder = withUsdWalletBuilder
                    .withoutRecipientWallet()
                    .withAmount({
                      amount: BigInt(uncheckedAmount),
                      currency: amountCurrency,
                    })

                  // @ts-ignore-next-line no-implicit-any error
                  const checkInputAmount = (payment) => {
                    expect(payment).toEqual(
                      expect.objectContaining({
                        inputAmount: BigInt(uncheckedAmount),
                      }),
                    )
                  }

                  it("correctly applies miner, bank and imbalance fees", async () => {
                    const minerFee = { amount: 300n, currency: WalletCurrency.Btc }
                    const payment = await withAmountBuilder
                      .withConversion(withConversionArgs)
                      .withMinerFee(minerFee)
                    if (payment instanceof Error) throw payment

                    const sendAmount = paymentAmountFromNumber({
                      amount: uncheckedAmount,
                      currency: amountCurrency,
                    })
                    if (sendAmount instanceof Error) throw sendAmount

                    const btcPaymentAmount =
                      amountCurrency === WalletCurrency.Btc
                        ? (sendAmount as BtcPaymentAmount)
                        : await convertForUsdWalletToBtcAddress.btcFromUsd(
                            sendAmount as UsdPaymentAmount,
                          )

                    const usdPaymentAmount =
                      amountCurrency === WalletCurrency.Usd
                        ? (sendAmount as UsdPaymentAmount)
                        : await convertForUsdWalletToBtcAddress.usdFromBtc(
                            sendAmount as BtcPaymentAmount,
                          )

                    const minBankFee = paymentAmountFromNumber({
                      amount: senderAccount.withdrawFee as Satoshis,
                      currency: WalletCurrency.Btc,
                    })
                    if (minBankFee instanceof Error) throw minBankFee

                    const imbalanceCalculator = ImbalanceCalculator({
                      method: feeConfig.withdrawMethod,
                      volumeAmountLightningFn,
                      volumeAmountOnChainFn,
                      sinceDaysAgo: feeConfig.withdrawDaysLookback,
                    })
                    const imbalanceForWallet =
                      await imbalanceCalculator.getSwapOutImbalanceAmount(
                        senderUsdWalletDescriptor,
                      )
                    if (imbalanceForWallet instanceof Error) throw imbalanceForWallet

                    const imbalance = await convertForUsdWalletToBtcAddress.btcFromUsd({
                      amount: imbalanceForWallet.amount,
                      currency: WalletCurrency.Usd,
                    })

                    const withdrawalFees = onChainFees.withdrawalFee({
                      minerFee,
                      amount: btcPaymentAmount,
                      minBankFee,
                      imbalance,
                    })
                    if (withdrawalFees instanceof Error) throw withdrawalFees
                    const btcProtocolAndBankFee = withdrawalFees.totalFee

                    const priceRatio = WalletPriceRatio({
                      usd: usdPaymentAmount,
                      btc: btcPaymentAmount,
                    })
                    if (priceRatio instanceof Error) throw priceRatio
                    const usdProtocolAndBankFee =
                      priceRatio.convertFromBtcToCeil(btcProtocolAndBankFee)

                    checkAddress(payment)
                    checkSettlementMethod(payment)
                    checkInputAmount(payment)
                    checkSenderWallet(payment)
                    expect(payment).toEqual(
                      expect.objectContaining({
                        btcPaymentAmount,
                        usdPaymentAmount,
                        btcProtocolAndBankFee,
                        usdProtocolAndBankFee,
                      }),
                    )
                  })
                })

                describe("with dust amount", () => {
                  it("correctly returns dust error", async () => {
                    const dustBtcAmount = {
                      amount: BigInt(dustAmount),
                      currency: WalletCurrency.Btc,
                    }
                    const dustUsdAmount =
                      await convertReverseForUsdWalletToBtcAddress.usdFromBtc(
                        dustBtcAmount,
                      )

                    expect(dustUsdAmount.amount).toBeGreaterThan(1n)
                    const minerFee = { amount: 300n, currency: WalletCurrency.Btc }

                    const paymentLowest = await withUsdWalletBuilder
                      .withoutRecipientWallet()
                      .withAmount({ amount: BigInt(1), currency: amountCurrency })
                      .withConversion(withConversionArgs)
                      .withMinerFee(minerFee)
                    expect(paymentLowest).toBeInstanceOf(LessThanDustThresholdError)

                    const paymentBelow = await withUsdWalletBuilder
                      .withoutRecipientWallet()
                      .withAmount({
                        amount: BigInt(dustUsdAmount.amount),
                        currency: amountCurrency,
                      })
                      .withConversion(withConversionArgs)
                      .withMinerFee(minerFee)
                    expect(paymentBelow).toBeInstanceOf(LessThanDustThresholdError)

                    const dustSendAmount =
                      amountCurrency === WalletCurrency.Btc
                        ? dustBtcAmount
                        : dustUsdAmount
                    const paymentAbove = await withUsdWalletBuilder
                      .withoutRecipientWallet()
                      .withAmount({
                        amount: BigInt(dustSendAmount.amount + 1n),
                        currency: amountCurrency,
                      })
                      .withConversion(withConversionArgs)
                      .withMinerFee(minerFee)
                    expect(paymentAbove).not.toBeInstanceOf(Error)
                  })
                })
              })
            })

            describe("intraledger settled", () => {
              // @ts-ignore-next-line no-implicit-any error
              const checkSettlementMethod = (payment) => {
                expect(payment).toEqual(
                  expect.objectContaining({
                    settlementMethod: SettlementMethod.IntraLedger,
                    paymentInitiationMethod: PaymentInitiationMethod.OnChain,
                    btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
                    usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
                  }),
                )
              }

              describe("with btc recipient wallet", () => {
                const convertForUsdWalletToBtcWallet = hedgeSellUsd

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

                const withBtcRecipientBuilder =
                  withUsdWalletBuilder.withRecipientWallet(recipientBtcArgs)

                it("correctly applies no fees, with normal amount", async () => {
                  const amount = uncheckedAmount
                  const withAmountBuilder = withBtcRecipientBuilder.withAmount({
                    amount: BigInt(amount),
                    currency: amountCurrency,
                  })

                  // @ts-ignore-next-line no-implicit-any error
                  const checkInputAmount = (payment) => {
                    expect(payment).toEqual(
                      expect.objectContaining({
                        inputAmount: BigInt(amount),
                      }),
                    )
                  }

                  const payment = await withAmountBuilder
                    .withConversion(withConversionArgs)
                    .withoutMinerFee()
                  if (payment instanceof Error) throw payment

                  const sendAmount = paymentAmountFromNumber({
                    amount,
                    currency: amountCurrency,
                  })
                  if (sendAmount instanceof Error) throw sendAmount

                  const btcPaymentAmount =
                    amountCurrency === WalletCurrency.Btc
                      ? (sendAmount as BtcPaymentAmount)
                      : await convertForUsdWalletToBtcWallet.btcFromUsd(
                          sendAmount as UsdPaymentAmount,
                        )

                  const usdPaymentAmount =
                    amountCurrency === WalletCurrency.Usd
                      ? (sendAmount as UsdPaymentAmount)
                      : await convertForUsdWalletToBtcWallet.usdFromBtc(
                          sendAmount as BtcPaymentAmount,
                        )

                  checkAddress(payment)
                  checkSettlementMethod(payment)
                  checkInputAmount(payment)
                  checkSenderWallet(payment)
                  checkRecipientWallet(payment)
                  expect(payment).toEqual(
                    expect.objectContaining({
                      btcPaymentAmount,
                      usdPaymentAmount,
                      btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
                      usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
                    }),
                  )
                })

                it("correctly applies no fees, with dust amount", async () => {
                  const amount = 1
                  const withAmountBuilder = withBtcRecipientBuilder.withAmount({
                    amount: BigInt(amount),
                    currency: amountCurrency,
                  })

                  // @ts-ignore-next-line no-implicit-any error
                  const checkInputAmount = (payment) => {
                    expect(payment).toEqual(
                      expect.objectContaining({
                        inputAmount: BigInt(amount),
                      }),
                    )
                  }

                  const payment = await withAmountBuilder
                    .withConversion(withConversionArgs)
                    .withoutMinerFee()
                  if (payment instanceof Error) throw payment

                  const sendAmount = paymentAmountFromNumber({
                    amount,
                    currency: amountCurrency,
                  })
                  if (sendAmount instanceof Error) throw sendAmount

                  const btcPaymentAmount =
                    amountCurrency === WalletCurrency.Btc
                      ? (sendAmount as BtcPaymentAmount)
                      : await convertForUsdWalletToBtcWallet.btcFromUsd(
                          sendAmount as UsdPaymentAmount,
                        )

                  const usdPaymentAmount =
                    amountCurrency === WalletCurrency.Usd
                      ? (sendAmount as UsdPaymentAmount)
                      : await convertForUsdWalletToBtcWallet.usdFromBtc(
                          sendAmount as BtcPaymentAmount,
                        )

                  checkAddress(payment)
                  checkSettlementMethod(payment)
                  checkInputAmount(payment)
                  checkSenderWallet(payment)
                  checkRecipientWallet(payment)
                  expect(payment).toEqual(
                    expect.objectContaining({
                      btcPaymentAmount,
                      usdPaymentAmount,
                      btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
                      usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
                    }),
                  )
                })
              })

              describe("with usd recipient wallet", () => {
                const convertForUsdWalletToUsdWallet = mid

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

                const withUsdRecipientBuilder =
                  withUsdWalletBuilder.withRecipientWallet(recipientUsdArgs)

                it("correctly applies no fees, with normal amount", async () => {
                  const amount = uncheckedAmount
                  const withAmountBuilder = withUsdRecipientBuilder.withAmount({
                    amount: BigInt(amount),
                    currency: amountCurrency,
                  })

                  // @ts-ignore-next-line no-implicit-any error
                  const checkInputAmount = (payment) => {
                    expect(payment).toEqual(
                      expect.objectContaining({
                        inputAmount: BigInt(amount),
                      }),
                    )
                  }

                  const payment = await withAmountBuilder
                    .withConversion(withConversionArgs)
                    .withoutMinerFee()
                  if (payment instanceof Error) throw payment

                  const sendAmount = paymentAmountFromNumber({
                    amount,
                    currency: amountCurrency,
                  })
                  if (sendAmount instanceof Error) throw sendAmount

                  const btcPaymentAmount =
                    amountCurrency === WalletCurrency.Btc
                      ? (sendAmount as BtcPaymentAmount)
                      : await convertForUsdWalletToUsdWallet.btcFromUsd(
                          sendAmount as UsdPaymentAmount,
                        )

                  const usdPaymentAmount =
                    amountCurrency === WalletCurrency.Usd
                      ? (sendAmount as UsdPaymentAmount)
                      : sendAmount.amount === 1n
                        ? ONE_CENT
                        : await convertForUsdWalletToUsdWallet.usdFromBtc(
                            sendAmount as BtcPaymentAmount,
                          )

                  checkAddress(payment)
                  checkSettlementMethod(payment)
                  checkInputAmount(payment)
                  checkSenderWallet(payment)
                  checkRecipientWallet(payment)
                  expect(payment).toEqual(
                    expect.objectContaining({
                      btcPaymentAmount,
                      usdPaymentAmount,
                      btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
                      usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
                    }),
                  )
                })

                it("correctly applies no fees, with dust amount", async () => {
                  const amount = 1
                  const withAmountBuilder = withUsdRecipientBuilder.withAmount({
                    amount: BigInt(amount),
                    currency: amountCurrency,
                  })

                  // @ts-ignore-next-line no-implicit-any error
                  const checkInputAmount = (payment) => {
                    expect(payment).toEqual(
                      expect.objectContaining({
                        inputAmount: BigInt(amount),
                      }),
                    )
                  }

                  const payment = await withAmountBuilder
                    .withConversion(withConversionArgs)
                    .withoutMinerFee()
                  if (payment instanceof Error) throw payment

                  const sendAmount = paymentAmountFromNumber({
                    amount,
                    currency: amountCurrency,
                  })
                  if (sendAmount instanceof Error) throw sendAmount

                  const btcPaymentAmount =
                    amountCurrency === WalletCurrency.Btc
                      ? (sendAmount as BtcPaymentAmount)
                      : await convertForUsdWalletToUsdWallet.btcFromUsd(
                          sendAmount as UsdPaymentAmount,
                        )

                  const usdPaymentAmount =
                    amountCurrency === WalletCurrency.Usd
                      ? (sendAmount as UsdPaymentAmount)
                      : sendAmount.amount === 1n
                        ? ONE_CENT
                        : await convertForUsdWalletToUsdWallet.usdFromBtc(
                            sendAmount as BtcPaymentAmount,
                          )

                  checkAddress(payment)
                  checkSettlementMethod(payment)
                  checkInputAmount(payment)
                  checkSenderWallet(payment)
                  checkRecipientWallet(payment)
                  expect(payment).toEqual(
                    expect.objectContaining({
                      btcPaymentAmount,
                      usdPaymentAmount,
                      btcProtocolAndBankFee: onChainFees.intraLedgerFees().btc,
                      usdProtocolAndBankFee: onChainFees.intraLedgerFees().usd,
                    }),
                  )
                })
              })
            })
          })
        }
      })
    })
  })

  describe("error states", () => {
    const amountCurrency = WalletCurrency.Btc

    describe("zero-value uncheckedAmount", () => {
      it("returns a ValidationError", async () => {
        const isIntraLedger = false
        const minerFee = { amount: 300n, currency: WalletCurrency.Btc }

        const payment = await OnChainPaymentFlowBuilder({
          volumeAmountLightningFn,
          volumeAmountOnChainFn,
          isExternalAddress: async () => Promise.resolve(!isIntraLedger),
          sendAll: false,
          dustThreshold,
        })
          .withAddress("address" as OnChainAddress)
          .withSenderWalletAndAccount({
            wallet: senderBtcWalletDescriptor,
            account: senderAccount,
          })
          .withoutRecipientWallet()
          .withAmount({ amount: BigInt(0), currency: amountCurrency })
          .withConversion(withConversionArgs)
          .withMinerFee(minerFee)

        expect(payment).toBeInstanceOf(ValidationError)
      })
    })

    describe("no recipient wallet despite IntraLedger", () => {
      it("returns InvalidLightningPaymentFlowBuilderStateError", async () => {
        const payment = await OnChainPaymentFlowBuilder({
          volumeAmountLightningFn,
          volumeAmountOnChainFn,
          isExternalAddress: async () => Promise.resolve(false),
          sendAll: false,
          dustThreshold,
        })
          .withAddress("address" as OnChainAddress)
          .withSenderWalletAndAccount({
            wallet: senderBtcWalletDescriptor,
            account: senderAccount,
          })
          .withoutRecipientWallet()
          .withAmount({ amount: BigInt(uncheckedAmount), currency: amountCurrency })
          .withConversion(withConversionArgs)
          .withoutMinerFee()

        expect(payment).toBeInstanceOf(InvalidOnChainPaymentFlowBuilderStateError)
      })
    })

    describe("sender and recipient are identical", () => {
      it("returns ImpossibleLightningPaymentFlowBuilderStateError", async () => {
        const payment = await OnChainPaymentFlowBuilder({
          volumeAmountLightningFn,
          volumeAmountOnChainFn,
          isExternalAddress: async () => Promise.resolve(false),
          sendAll: false,
          dustThreshold,
        })
          .withAddress("address" as OnChainAddress)
          .withSenderWalletAndAccount({
            wallet: senderBtcWalletDescriptor,
            account: senderAccount,
          })
          .withRecipientWallet(senderBtcAsRecipientArgs)
          .withAmount({ amount: BigInt(uncheckedAmount), currency: amountCurrency })
          .withConversion(withConversionArgs)
          .withoutMinerFee()

        expect(payment).toBeInstanceOf(SelfPaymentError)
      })
    })

    describe("btcProposedAmount below dust from withConversion builder", () => {
      it("returns LessThanDustThresholdError", async () => {
        const builder = await OnChainPaymentFlowBuilder({
          volumeAmountLightningFn,
          volumeAmountOnChainFn,
          isExternalAddress: async () => Promise.resolve(true),
          sendAll: false,
          dustThreshold,
        })
          .withAddress("address" as OnChainAddress)
          .withSenderWalletAndAccount({
            wallet: senderBtcWalletDescriptor,
            account: senderAccount,
          })
          .withoutRecipientWallet()
          .withAmount({ amount: BigInt(dustAmount), currency: amountCurrency })
          .withConversion(withConversionArgs)

        const proposedBtcAmount = await builder.btcProposedAmount()
        expect(proposedBtcAmount).toBeInstanceOf(LessThanDustThresholdError)

        const proposedAmounts = await builder.proposedAmounts()
        expect(proposedAmounts).toBeInstanceOf(LessThanDustThresholdError)
      })
    })
  })
})
