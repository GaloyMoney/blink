import { getFeesConfig, getOnChainWalletConfig } from "@config"

import { SettlementMethod, PaymentInitiationMethod, OnChainFees } from "@domain/wallets"
import { LessThanDustThresholdError, SelfPaymentError } from "@domain/errors"
import {
  InvalidOnChainPaymentFlowBuilderStateError,
  WalletPriceRatio,
} from "@domain/payments"
import {
  ONE_CENT,
  paymentAmountFromNumber,
  ValidationError,
  WalletCurrency,
} from "@domain/shared"
import { OnChainPaymentFlowBuilder } from "@domain/payments/onchain-payment-flow-builder"
import { toSats } from "@domain/bitcoin"
import { ImbalanceCalculator } from "@domain/ledger/imbalance-calculator"

const feeConfig = getFeesConfig()
const { dustThreshold } = getOnChainWalletConfig()

describe("OnChainPaymentFlowBuilder", () => {
  const address = "address" as OnChainAddress
  const uncheckedAmount = 10000
  const dustAmount = dustThreshold - 1

  const senderBtcWallet = {
    id: "senderWalletId" as WalletId,
    currency: WalletCurrency.Btc,
    accountId: "senderAccountId" as AccountId,
    userId: "senderUserId" as UserId,
  }
  const senderAccount = { withdrawFee: toSats(100) } as Account
  const recipientBtcWallet = {
    id: "recipientWalletId" as WalletId,
    currency: WalletCurrency.Btc,
    accountId: "recipientAccountId" as AccountId,
    username: "Username" as Username,
    userId: "recipientUserId" as UserId,
  }
  const senderUsdWallet = {
    id: "walletId" as WalletId,
    currency: WalletCurrency.Usd,
    accountId: "senderAccountId" as AccountId,
  }
  const recipientUsdWallet = {
    id: "recipientWalletId" as WalletId,
    currency: WalletCurrency.Usd,
    accountId: "recipientAccountId" as AccountId,
    username: "Username" as Username,
    userId: "recipientUserId" as UserId,
  }

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

  const withConversionArgs = {
    mid,
    hedgeBuyUsd,
    hedgeSellUsd,
  }

  const volumeLightningFn = async () =>
    Promise.resolve({
      outgoingBaseAmount: toSats(1000),
      incomingBaseAmount: toSats(1000),
    })

  const volumeOnChainFn = async () =>
    Promise.resolve({
      outgoingBaseAmount: toSats(1000),
      incomingBaseAmount: toSats(1000),
    })

  describe("onchain initiated", () => {
    const onChainBuilder = OnChainPaymentFlowBuilder({
      volumeLightningFn,
      volumeOnChainFn,
      isExternalAddress: async (state) =>
        /* eslint @typescript-eslint/ban-ts-comment: "off" */
        // @ts-ignore-next-line error
        Promise.resolve(!state.recipientWalletId),
      sendAll: false,
      dustThreshold,
    })

    describe("with address", () => {
      const withAddressBuilder = onChainBuilder.withAddress(address)
      const checkAddress = (payment) => {
        expect(payment).toEqual(
          expect.objectContaining({
            address,
          }),
        )
      }

      describe("with btc wallet", () => {
        const withBtcWalletBuilder = withAddressBuilder.withSenderWalletAndAccount({
          wallet: senderBtcWallet,
          account: senderAccount,
        })

        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderBtcWallet.id,
              senderWalletCurrency: senderBtcWallet.currency,
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

                const usdPaymentAmount = await convertForBtcWalletToBtcAddress.usdFromBtc(
                  btcPaymentAmount,
                )

                const sendAmount = paymentAmountFromNumber({
                  amount: uncheckedAmount,
                  currency: WalletCurrency.Btc,
                })
                if (sendAmount instanceof Error) throw sendAmount

                const minBankFee = paymentAmountFromNumber({
                  amount: senderAccount.withdrawFee,
                  currency: WalletCurrency.Btc,
                })
                if (minBankFee instanceof Error) throw minBankFee

                const imbalanceCalculator = ImbalanceCalculator({
                  method: feeConfig.withdrawMethod,
                  volumeLightningFn,
                  volumeOnChainFn,
                  sinceDaysAgo: feeConfig.withdrawDaysLookback,
                })
                const imbalance = await imbalanceCalculator.getSwapOutImbalanceAmount(
                  senderBtcWallet,
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
                const usdProtocolAndBankFee = await walletPriceRatio.convertFromBtcToCeil(
                  btcProtocolAndBankFee,
                )

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

            const checkRecipientWallet = (payment) => {
              expect(payment).toEqual(
                expect.objectContaining({
                  recipientWalletId: recipientBtcWallet.id,
                  recipientWalletCurrency: recipientBtcWallet.currency,
                  recipientUsername: recipientBtcWallet.username,
                }),
              )
            }

            const withAmountDescribes = [
              { name: "with amount", amount: uncheckedAmount },
              { name: "with dust amount", amount: dustAmount },
              { name: "with min amount", amount: 51 }, // Close to 1 cent
            ]

            const describeWithAmount = ({ name, amount }) => {
              describe(`${name}`, () => {
                const withAmountBuilder = withBtcWalletBuilder
                  .withRecipientWallet(recipientBtcWallet)
                  .withAmount({ amount: BigInt(amount), currency: amountCurrency })
                const checkInputAmount = (payment) => {
                  expect(payment).toEqual(
                    expect.objectContaining({
                      inputAmount: BigInt(amount),
                    }),
                  )
                }

                it("correctly applies no fees", async () => {
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
            }

            for (const args of withAmountDescribes) {
              describeWithAmount(args)
            }
          })

          describe("with usd recipient wallet", () => {
            const convertForBtcWalletToUsdWallet = hedgeBuyUsd

            const checkRecipientWallet = (payment) => {
              expect(payment).toEqual(
                expect.objectContaining({
                  recipientWalletId: recipientUsdWallet.id,
                  recipientWalletCurrency: recipientUsdWallet.currency,
                  recipientUsername: recipientUsdWallet.username,
                }),
              )
            }

            const withAmountDescribes = [
              { name: "with amount", amount: uncheckedAmount },
              { name: "with dust amount", amount: dustAmount },
              { name: "with min amount", amount: 51 }, // Close to 1 cent
            ]

            const describeWithAmount = ({ name, amount }) => {
              describe(`${name}`, () => {
                const withAmountBuilder = withBtcWalletBuilder
                  .withRecipientWallet(recipientUsdWallet)
                  .withAmount({ amount: BigInt(amount), currency: amountCurrency })
                const checkInputAmount = (payment) => {
                  expect(payment).toEqual(
                    expect.objectContaining({
                      inputAmount: BigInt(amount),
                    }),
                  )
                }

                it("correctly applies no fees", async () => {
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
              })
            }

            for (const args of withAmountDescribes) {
              describeWithAmount(args)
            }
          })
        })
      })

      describe("with usd wallet", () => {
        const withUsdWalletBuilder = withAddressBuilder.withSenderWalletAndAccount({
          wallet: senderUsdWallet,
          account: senderAccount,
        })

        const checkSenderWallet = (payment) => {
          expect(payment).toEqual(
            expect.objectContaining({
              senderWalletId: senderUsdWallet.id,
              senderWalletCurrency: senderUsdWallet.currency,
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
                      amount: senderAccount.withdrawFee,
                      currency: WalletCurrency.Btc,
                    })
                    if (minBankFee instanceof Error) throw minBankFee

                    const imbalanceCalculator = ImbalanceCalculator({
                      method: feeConfig.withdrawMethod,
                      volumeLightningFn,
                      volumeOnChainFn,
                      sinceDaysAgo: feeConfig.withdrawDaysLookback,
                    })
                    const imbalanceForWallet =
                      await imbalanceCalculator.getSwapOutImbalanceAmount(senderUsdWallet)
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

                const checkRecipientWallet = (payment) => {
                  expect(payment).toEqual(
                    expect.objectContaining({
                      recipientWalletId: recipientBtcWallet.id,
                      recipientWalletCurrency: recipientBtcWallet.currency,
                      recipientUsername: recipientBtcWallet.username,
                    }),
                  )
                }

                const withAmountDescribes = [
                  { name: "with amount", amount: uncheckedAmount },
                  { name: "with dust amount", amount: 1 },
                ]

                const describeWithAmount = ({ name, amount }) => {
                  describe(`${name}`, () => {
                    const withAmountBuilder = withUsdWalletBuilder
                      .withRecipientWallet(recipientBtcWallet)
                      .withAmount({ amount: BigInt(amount), currency: amountCurrency })
                    const checkInputAmount = (payment) => {
                      expect(payment).toEqual(
                        expect.objectContaining({
                          inputAmount: BigInt(amount),
                        }),
                      )
                    }

                    it("correctly applies no fees", async () => {
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
                }

                for (const args of withAmountDescribes) {
                  describeWithAmount(args)
                }
              })

              describe("with usd recipient wallet", () => {
                const convertForUsdWalletToUsdWallet = mid

                const checkRecipientWallet = (payment) => {
                  expect(payment).toEqual(
                    expect.objectContaining({
                      recipientWalletId: recipientUsdWallet.id,
                      recipientWalletCurrency: recipientUsdWallet.currency,
                      recipientUsername: recipientUsdWallet.username,
                    }),
                  )
                }

                const withAmountDescribes = [
                  { name: "with amount", amount: uncheckedAmount },
                  { name: "with dust amount", amount: 1 },
                ]

                const describeWithAmount = ({ name, amount }) => {
                  describe(`${name}`, () => {
                    const withAmountBuilder = withUsdWalletBuilder
                      .withRecipientWallet(recipientUsdWallet)
                      .withAmount({ amount: BigInt(amount), currency: amountCurrency })
                    const checkInputAmount = (payment) => {
                      expect(payment).toEqual(
                        expect.objectContaining({
                          inputAmount: BigInt(amount),
                        }),
                      )
                    }

                    it("correctly applies no fees", async () => {
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
                }

                for (const args of withAmountDescribes) {
                  describeWithAmount(args)
                }
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
          volumeLightningFn,
          volumeOnChainFn,
          isExternalAddress: async () => Promise.resolve(!isIntraLedger),
          sendAll: false,
          dustThreshold,
        })
          .withAddress("address" as OnChainAddress)
          .withSenderWalletAndAccount({
            wallet: senderBtcWallet,
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
          volumeLightningFn,
          volumeOnChainFn,
          isExternalAddress: async () => Promise.resolve(false),
          sendAll: false,
          dustThreshold,
        })
          .withAddress("address" as OnChainAddress)
          .withSenderWalletAndAccount({
            wallet: senderBtcWallet,
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
          volumeLightningFn,
          volumeOnChainFn,
          isExternalAddress: async () => Promise.resolve(false),
          sendAll: false,
          dustThreshold,
        })
          .withAddress("address" as OnChainAddress)
          .withSenderWalletAndAccount({
            wallet: senderBtcWallet,
            account: senderAccount,
          })
          .withRecipientWallet(senderBtcWallet)
          .withAmount({ amount: BigInt(uncheckedAmount), currency: amountCurrency })
          .withConversion(withConversionArgs)
          .withoutMinerFee()

        expect(payment).toBeInstanceOf(SelfPaymentError)
      })
    })

    describe("btcProposedAmount below dust from withConversion builder", () => {
      it("returns LessThanDustThresholdError", async () => {
        const builder = await OnChainPaymentFlowBuilder({
          volumeLightningFn,
          volumeOnChainFn,
          isExternalAddress: async () => Promise.resolve(true),
          sendAll: false,
          dustThreshold,
        })
          .withAddress("address" as OnChainAddress)
          .withSenderWalletAndAccount({
            wallet: senderBtcWallet,
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
