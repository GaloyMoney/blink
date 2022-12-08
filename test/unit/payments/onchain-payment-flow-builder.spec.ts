import { getFeesConfig, getOnChainWalletConfig } from "@config"

import { SettlementMethod, PaymentInitiationMethod, OnChainFees } from "@domain/wallets"
import { LessThanDustThresholdError, SelfPaymentError } from "@domain/errors"
import { InvalidOnChainPaymentFlowBuilderStateError, PriceRatio } from "@domain/payments"
import { paymentAmountFromNumber, ValidationError, WalletCurrency } from "@domain/shared"
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
            describe("with amount", () => {
              const withAmountBuilder = withBtcWalletBuilder
                .withoutRecipientWallet()
                .withAmount(uncheckedAmount)
              const checkAmount = (payment) => {
                expect(payment).toEqual(
                  expect.objectContaining({
                    btcPaymentAmount: {
                      amount: BigInt(uncheckedAmount),
                      currency: WalletCurrency.Btc,
                    },
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

                const usdPaymentAmount = await usdFromBtcMid({
                  amount: BigInt(uncheckedAmount),
                  currency: WalletCurrency.Btc,
                })

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

                const btcProtocolFee = withdrawFees.totalFee
                const usdProtocolFee = await usdFromBtcMid(btcProtocolFee)

                checkAddress(payment)
                checkSettlementMethod(payment)
                checkAmount(payment)
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

            describe("with dust amount", () => {
              it("correctly returns dust error", async () => {
                const minerFee = { amount: 300n, currency: WalletCurrency.Btc }

                const paymentLowest = await withBtcWalletBuilder
                  .withoutRecipientWallet()
                  .withAmount(51) // Close to 1 cent
                  .withConversion(withConversionArgs)
                  .withMinerFee(minerFee)
                expect(paymentLowest).toBeInstanceOf(LessThanDustThresholdError)

                const paymentBelow = await withBtcWalletBuilder
                  .withoutRecipientWallet()
                  .withAmount(dustAmount)
                  .withConversion(withConversionArgs)
                  .withMinerFee(minerFee)
                expect(paymentBelow).toBeInstanceOf(LessThanDustThresholdError)

                const paymentAbove = await withBtcWalletBuilder
                  .withoutRecipientWallet()
                  .withAmount(dustAmount + 1)
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
                btcProtocolFee: onChainFees.intraLedgerFees().btc,
                usdProtocolFee: onChainFees.intraLedgerFees().usd,
              }),
            )
          }

          describe("with btc recipient wallet", () => {
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
              describe(name, () => {
                const withAmountBuilder = withBtcWalletBuilder
                  .withRecipientWallet(recipientBtcWallet)
                  .withAmount(amount)
                const checkAmount = (payment) => {
                  expect(payment).toEqual(
                    expect.objectContaining({
                      btcPaymentAmount: {
                        amount: BigInt(amount),
                        currency: WalletCurrency.Btc,
                      },
                      inputAmount: BigInt(amount),
                    }),
                  )
                }

                it("correctly applies no fees", async () => {
                  const payment = await withAmountBuilder
                    .withConversion(withConversionArgs)
                    .withoutMinerFee()
                  if (payment instanceof Error) throw payment

                  const usdPaymentAmount = await usdFromBtcMid({
                    amount: BigInt(amount),
                    currency: WalletCurrency.Btc,
                  })

                  checkAddress(payment)
                  checkSettlementMethod(payment)
                  checkAmount(payment)
                  checkSenderWallet(payment)
                  checkRecipientWallet(payment)
                  expect(payment).toEqual(
                    expect.objectContaining({
                      usdPaymentAmount,
                      btcProtocolFee: onChainFees.intraLedgerFees().btc,
                      usdProtocolFee: onChainFees.intraLedgerFees().usd,
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
              describe(name, () => {
                const withAmountBuilder = withBtcWalletBuilder
                  .withRecipientWallet(recipientUsdWallet)
                  .withAmount(amount)
                const checkAmount = (payment) => {
                  expect(payment).toEqual(
                    expect.objectContaining({
                      btcPaymentAmount: {
                        amount: BigInt(amount),
                        currency: WalletCurrency.Btc,
                      },
                      inputAmount: BigInt(amount),
                    }),
                  )
                }

                it("correctly applies no fees", async () => {
                  const payment = await withAmountBuilder
                    .withConversion(withConversionArgs)
                    .withoutMinerFee()
                  if (payment instanceof Error) throw payment

                  const usdPaymentAmount = await usdFromBtcBuy({
                    amount: BigInt(amount),
                    currency: WalletCurrency.Btc,
                  })

                  checkAddress(payment)
                  checkSettlementMethod(payment)
                  checkAmount(payment)
                  checkSenderWallet(payment)
                  checkRecipientWallet(payment)
                  expect(payment).toEqual(
                    expect.objectContaining({
                      usdPaymentAmount,
                      btcProtocolFee: onChainFees.intraLedgerFees().btc,
                      usdProtocolFee: onChainFees.intraLedgerFees().usd,
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
            describe("with amount", () => {
              const withAmountBuilder = withUsdWalletBuilder
                .withoutRecipientWallet()
                .withAmount(uncheckedAmount)
              const checkAmount = (payment) => {
                expect(payment).toEqual(
                  // TODO: check that btcPaymentAmount doesn't exist?
                  expect.objectContaining({
                    usdPaymentAmount: {
                      amount: BigInt(uncheckedAmount),
                      currency: WalletCurrency.Usd,
                    },
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

                const btcPaymentAmount = await btcFromUsdSell({
                  amount: BigInt(uncheckedAmount),
                  currency: WalletCurrency.Usd,
                })

                const sendAmount = paymentAmountFromNumber({
                  amount: uncheckedAmount,
                  currency: WalletCurrency.Usd,
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
                const imbalanceForWallet =
                  await imbalanceCalculator.getSwapOutImbalanceAmount(senderUsdWallet)
                if (imbalanceForWallet instanceof Error) throw imbalanceForWallet

                const imbalance = await btcFromUsdSell({
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
                const btcProtocolFee = withdrawalFees.totalFee

                const priceRatio = PriceRatio({
                  usd: sendAmount,
                  btc: btcPaymentAmount,
                })
                if (priceRatio instanceof Error) throw priceRatio
                const usdProtocolFee = priceRatio.convertFromBtcToCeil(btcProtocolFee)

                checkAddress(payment)
                checkSettlementMethod(payment)
                checkAmount(payment)
                checkSenderWallet(payment)
                expect(payment).toEqual(
                  expect.objectContaining({
                    btcPaymentAmount,
                    btcProtocolFee,
                    usdProtocolFee,
                  }),
                )
              })
            })

            describe("with dust amount", () => {
              it("correctly returns dust error", async () => {
                const dustUsdAmount = await usdFromBtcMid({
                  amount: BigInt(dustAmount),
                  currency: WalletCurrency.Btc,
                })
                expect(dustUsdAmount.amount).toBeGreaterThan(1n)
                const minerFee = { amount: 300n, currency: WalletCurrency.Btc }

                const paymentLowest = await withUsdWalletBuilder
                  .withoutRecipientWallet()
                  .withAmount(1)
                  .withConversion(withConversionArgs)
                  .withMinerFee(minerFee)
                expect(paymentLowest).toBeInstanceOf(LessThanDustThresholdError)

                const paymentBelow = await withUsdWalletBuilder
                  .withoutRecipientWallet()
                  .withAmount(Number(dustUsdAmount.amount))
                  .withConversion(withConversionArgs)
                  .withMinerFee(minerFee)
                expect(paymentBelow).toBeInstanceOf(LessThanDustThresholdError)

                const paymentAbove = await withUsdWalletBuilder
                  .withoutRecipientWallet()
                  .withAmount(Number(dustUsdAmount.amount + 1n))
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
                btcProtocolFee: onChainFees.intraLedgerFees().btc,
                usdProtocolFee: onChainFees.intraLedgerFees().usd,
              }),
            )
          }

          describe("with btc recipient wallet", () => {
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
              describe(name, () => {
                const withAmountBuilder = withUsdWalletBuilder
                  .withRecipientWallet(recipientBtcWallet)
                  .withAmount(amount)
                const checkAmount = (payment) => {
                  expect(payment).toEqual(
                    expect.objectContaining({
                      usdPaymentAmount: {
                        amount: BigInt(amount),
                        currency: WalletCurrency.Usd,
                      },
                      inputAmount: BigInt(amount),
                    }),
                  )
                }

                it("correctly applies no fees", async () => {
                  const payment = await withAmountBuilder
                    .withConversion(withConversionArgs)
                    .withoutMinerFee()
                  if (payment instanceof Error) throw payment

                  const btcPaymentAmount = await btcFromUsdSell({
                    amount: BigInt(amount),
                    currency: WalletCurrency.Usd,
                  })

                  checkAddress(payment)
                  checkSettlementMethod(payment)
                  checkAmount(payment)
                  checkSenderWallet(payment)
                  checkRecipientWallet(payment)
                  expect(payment).toEqual(
                    expect.objectContaining({
                      btcPaymentAmount,
                      btcProtocolFee: onChainFees.intraLedgerFees().btc,
                      usdProtocolFee: onChainFees.intraLedgerFees().usd,
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
              describe(name, () => {
                const withAmountBuilder = withUsdWalletBuilder
                  .withRecipientWallet(recipientUsdWallet)
                  .withAmount(amount)
                const checkAmount = (payment) => {
                  expect(payment).toEqual(
                    expect.objectContaining({
                      usdPaymentAmount: {
                        amount: BigInt(amount),
                        currency: WalletCurrency.Usd,
                      },
                      inputAmount: BigInt(amount),
                    }),
                  )
                }

                it("correctly applies no fees", async () => {
                  const payment = await withAmountBuilder
                    .withConversion(withConversionArgs)
                    .withoutMinerFee()
                  if (payment instanceof Error) throw payment

                  const btcPaymentAmount = await btcFromUsdMid({
                    amount: BigInt(amount),
                    currency: WalletCurrency.Usd,
                  })

                  checkAddress(payment)
                  checkSettlementMethod(payment)
                  checkAmount(payment)
                  checkSenderWallet(payment)
                  checkRecipientWallet(payment)
                  expect(payment).toEqual(
                    expect.objectContaining({
                      btcPaymentAmount,
                      btcProtocolFee: onChainFees.intraLedgerFees().btc,
                      usdProtocolFee: onChainFees.intraLedgerFees().usd,
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
    })
  })

  describe("error states", () => {
    describe("non-integer uncheckedAmount", () => {
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
          .withAmount(0.4)
          .withConversion(withConversionArgs)
          .withMinerFee(minerFee)

        expect(payment).toBeInstanceOf(ValidationError)
      })
    })
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
          .withAmount(0)
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
          .withAmount(uncheckedAmount)
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
          .withAmount(uncheckedAmount)
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
          .withAmount(dustAmount)
          .withConversion(withConversionArgs)

        const proposedBtcAmount = await builder.btcProposedAmount()
        expect(proposedBtcAmount).toBeInstanceOf(LessThanDustThresholdError)

        const proposedAmounts = await builder.proposedAmounts()
        expect(proposedAmounts).toBeInstanceOf(LessThanDustThresholdError)
      })
    })
  })
})
