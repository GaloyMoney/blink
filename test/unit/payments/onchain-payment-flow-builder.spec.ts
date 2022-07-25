import { getFeesConfig } from "@config"

import { SettlementMethod, PaymentInitiationMethod, OnChainFees } from "@domain/wallets"
import { SelfPaymentError } from "@domain/errors"
import {
  LightningPaymentFlowBuilder,
  InvalidLightningPaymentFlowBuilderStateError,
} from "@domain/payments"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  ValidationError,
  WalletCurrency,
} from "@domain/shared"
import { OnChainPaymentFlowBuilder } from "@domain/payments/onchain-payment-flow-builder"
import { LedgerService } from "@services/ledger"
import { toSats } from "@domain/bitcoin"
import { ImbalanceCalculator } from "@domain/ledger/imbalance-calculator"

const calc = AmountCalculator()
const feeConfig = getFeesConfig()

describe("OnChainPaymentFlowBuilder", () => {
  const address = "address" as OnChainAddress
  const uncheckedAmount = 10000

  const senderBtcWallet = {
    id: "senderWalletId" as WalletId,
    currency: WalletCurrency.Btc,
  }
  const senderAccount = { withdrawFee: toSats(100) } as Account
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

  // ~0.045 ratio (0.045 cents/sat, or $45,455 USD/BTC)
  const inverseMidPriceRatio = 22n
  const mulByMidPriceRatio = (amount: bigint): bigint => amount / inverseMidPriceRatio
  const mulCeilByMidPriceRatio = (amount: bigint): bigint =>
    calc.divCeil({ amount, currency: WalletCurrency.Btc }, inverseMidPriceRatio).amount
  const divByMidPriceRatio = (amount: bigint): bigint => amount * inverseMidPriceRatio

  // ~0.3448 ratio (~32% spread on 0.045 cents/sat rate)
  const inverseDealerPriceRatio = 29n
  const mulByDealerPriceRatio = (amount: bigint): bigint =>
    calc.divRound({ amount, currency: WalletCurrency.Btc }, inverseDealerPriceRatio)
      .amount
  // const mulCeilByDealerPriceRatio = (amount: bigint): bigint =>
  //   calc.divCeil({ amount, currency: WalletCurrency.Btc }, inverseDealerPriceRatio).amount
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

  describe("onchain initiated, onchain settled", () => {
    const ledger = LedgerService()

    const onChainBuilder = OnChainPaymentFlowBuilder({
      usdFromBtcMidPriceFn,
      btcFromUsdMidPriceFn,
      volumeLightningFn: ledger.lightningTxBaseVolumeSince,
      volumeOnChainFn: ledger.onChainTxBaseVolumeSince,
    })
    const checkSettlementMethod = (payment) => {
      expect(payment).toEqual(
        expect.objectContaining({
          settlementMethod: SettlementMethod.OnChain,
          paymentInitiationMethod: PaymentInitiationMethod.OnChain,
        }),
      )
    }

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
                .withConversion({
                  usdFromBtc,
                  btcFromUsd,
                })
                .withMinerFee(minerFee)
              if (payment instanceof Error) throw payment

              const usdPaymentAmount = {
                amount: mulByMidPriceRatio(BigInt(uncheckedAmount)),
                currency: WalletCurrency.Usd,
              }

              const sendAmount = paymentAmountFromNumber({
                amount: uncheckedAmount,
                currency: WalletCurrency.Btc,
              })
              if (sendAmount instanceof Error) throw sendAmount

              const minBankFee = paymentAmountFromNumber({
                amount: senderAccount.withdrawFee,
                currency: WalletCurrency.Btc,
              })
              if (minBankFee instanceof Error) return minBankFee

              const imbalanceCalculator = ImbalanceCalculator({
                method: feeConfig.withdrawMethod,
                volumeLightningFn: ledger.lightningTxBaseVolumeSince,
                volumeOnChainFn: ledger.onChainTxBaseVolumeSince,
                sinceDaysAgo: feeConfig.withdrawDaysLookback,
              })
              const imbalance = await imbalanceCalculator.getSwapOutImbalanceAmount(
                senderBtcWallet,
              )
              if (imbalance instanceof Error) return imbalance

              const btcProtocolFee = onChainFees.withdrawalFee({
                minerFee,
                amount: sendAmount,
                minBankFee,
                imbalance,
              })
              if (btcProtocolFee instanceof Error) return btcProtocolFee
              expect(btcProtocolFee).not.toBeInstanceOf(Error)

              const usdProtocolFee = {
                amount: mulCeilByMidPriceRatio(btcProtocolFee.totalFee.amount),
                currency: WalletCurrency.Usd,
              }

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
        })

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

          describe("with amount", () => {
            const withAmountBuilder = withBtcWalletBuilder
              .withRecipientWallet(recipientBtcWallet)
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

            it("correctly applies no fees", async () => {
              const payment = await withAmountBuilder
                .withConversion({
                  usdFromBtc,
                  btcFromUsd,
                })
                .withoutMinerFee()
              if (payment instanceof Error) throw payment

              const usdPaymentAmount = {
                amount: mulByMidPriceRatio(BigInt(uncheckedAmount)),
                currency: WalletCurrency.Usd,
              }

              checkAddress(payment)
              checkSettlementMethod(payment)
              checkAmount(payment)
              checkSenderWallet(payment)
              checkRecipientWallet(payment)
              expect(payment).toEqual(
                expect.objectContaining({
                  usdPaymentAmount,
                  btcProtocolFee: onChainFees.intraLedgerFees().btc,
                  usdProtocolFee: onChainFees.intraLedgerFees().btc,
                }),
              )
            })
          })
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

          describe("with amount", () => {
            const withAmountBuilder = withBtcWalletBuilder
              .withRecipientWallet(recipientUsdWallet)
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

            it("correctly applies no fees", async () => {
              const payment = await withAmountBuilder
                .withConversion({
                  usdFromBtc,
                  btcFromUsd,
                })
                .withoutMinerFee()
              if (payment instanceof Error) throw payment

              const usdPaymentAmount = {
                amount: mulByMidPriceRatio(BigInt(uncheckedAmount)),
                currency: WalletCurrency.Usd,
              }

              checkAddress(payment)
              checkSettlementMethod(payment)
              checkAmount(payment)
              checkSenderWallet(payment)
              checkRecipientWallet(payment)
              expect(payment).toEqual(
                expect.objectContaining({
                  usdPaymentAmount,
                  btcProtocolFee: onChainFees.intraLedgerFees().btc,
                  usdProtocolFee: onChainFees.intraLedgerFees().btc,
                }),
              )
            })
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
                .withConversion({
                  usdFromBtc,
                  btcFromUsd,
                })
                .withMinerFee(minerFee)
              if (payment instanceof Error) throw payment

              const btcPaymentAmount = {
                amount: divByDealerPriceRatio(BigInt(uncheckedAmount)),
                currency: WalletCurrency.Btc,
              }

              const sendAmount = paymentAmountFromNumber({
                amount: uncheckedAmount,
                currency: WalletCurrency.Usd,
              })
              if (sendAmount instanceof Error) throw sendAmount

              const minBankFee = paymentAmountFromNumber({
                amount: senderAccount.withdrawFee,
                currency: WalletCurrency.Btc,
              })
              if (minBankFee instanceof Error) return minBankFee

              const imbalanceCalculator = ImbalanceCalculator({
                method: feeConfig.withdrawMethod,
                volumeLightningFn: ledger.lightningTxBaseVolumeSince,
                volumeOnChainFn: ledger.onChainTxBaseVolumeSince,
                sinceDaysAgo: feeConfig.withdrawDaysLookback,
              })
              const imbalanceForWallet =
                await imbalanceCalculator.getSwapOutImbalanceAmount(senderUsdWallet)
              if (imbalanceForWallet instanceof Error) return imbalanceForWallet

              const imbalance = {
                amount: divByDealerPriceRatio(imbalanceForWallet.amount),
                currency: WalletCurrency.Btc,
              }

              const btcProtocolFee = onChainFees.withdrawalFee({
                minerFee,
                amount: btcPaymentAmount,
                minBankFee,
                imbalance,
              })
              if (btcProtocolFee instanceof Error) return btcProtocolFee
              expect(btcProtocolFee).not.toBeInstanceOf(Error)

              const usdProtocolFee = {
                amount: mulCeilByMidPriceRatio(btcProtocolFee.totalFee.amount),
                currency: WalletCurrency.Usd,
              }

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
        })

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

          describe("with amount", () => {
            const withAmountBuilder = withUsdWalletBuilder
              .withRecipientWallet(recipientBtcWallet)
              .withAmount(uncheckedAmount)
            const checkAmount = (payment) => {
              expect(payment).toEqual(
                expect.objectContaining({
                  usdPaymentAmount: {
                    amount: BigInt(uncheckedAmount),
                    currency: WalletCurrency.Usd,
                  },
                  inputAmount: BigInt(uncheckedAmount),
                }),
              )
            }

            it("correctly applies no fees", async () => {
              const payment = await withAmountBuilder
                .withConversion({
                  usdFromBtc,
                  btcFromUsd,
                })
                .withoutMinerFee()
              if (payment instanceof Error) throw payment

              const btcPaymentAmount = {
                amount: divByMidPriceRatio(BigInt(uncheckedAmount)),
                currency: WalletCurrency.Btc,
              }

              checkAddress(payment)
              checkSettlementMethod(payment)
              checkAmount(payment)
              checkSenderWallet(payment)
              checkRecipientWallet(payment)
              expect(payment).toEqual(
                expect.objectContaining({
                  btcPaymentAmount,
                  btcProtocolFee: onChainFees.intraLedgerFees().btc,
                  usdProtocolFee: onChainFees.intraLedgerFees().btc,
                }),
              )
            })
          })
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

          describe("with amount", () => {
            const withAmountBuilder = withUsdWalletBuilder
              .withRecipientWallet(recipientUsdWallet)
              .withAmount(uncheckedAmount)
            const checkAmount = (payment) => {
              expect(payment).toEqual(
                expect.objectContaining({
                  usdPaymentAmount: {
                    amount: BigInt(uncheckedAmount),
                    currency: WalletCurrency.Usd,
                  },
                  inputAmount: BigInt(uncheckedAmount),
                }),
              )
            }

            it("correctly applies no fees", async () => {
              const payment = await withAmountBuilder
                .withConversion({
                  usdFromBtc,
                  btcFromUsd,
                })
                .withoutMinerFee()
              if (payment instanceof Error) throw payment

              const btcPaymentAmount = {
                amount: divByMidPriceRatio(BigInt(uncheckedAmount)),
                currency: WalletCurrency.Btc,
              }

              checkAddress(payment)
              checkSettlementMethod(payment)
              checkAmount(payment)
              checkSenderWallet(payment)
              checkRecipientWallet(payment)
              expect(payment).toEqual(
                expect.objectContaining({
                  btcPaymentAmount,
                  btcProtocolFee: onChainFees.intraLedgerFees().btc,
                  usdProtocolFee: onChainFees.intraLedgerFees().btc,
                }),
              )
            })
          })
        })
      })
    })
  })

  // TODO: REACHED HERE
  describe("onchain initiated, intraledger settled", () => {
    const ledger = LedgerService()

    const intraLedgerBuilder = OnChainPaymentFlowBuilder({
      usdFromBtcMidPriceFn,
      btcFromUsdMidPriceFn,
      volumeLightningFn: ledger.lightningTxBaseVolumeSince,
      volumeOnChainFn: ledger.onChainTxBaseVolumeSince,
    })
    const checkSettlementMethod = (payment) => {
      expect(payment).toEqual(
        expect.objectContaining({
          settlementMethod: SettlementMethod.OnChain,
          paymentInitiationMethod: PaymentInitiationMethod.OnChain,
        }),
      )
    }

    describe("with address", () => {
      const withAddressBuilder = intraLedgerBuilder.withAddress(address)
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
      const withAmountBuilder = intraLedgerBuilder.withNoAmountInvoice({
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
