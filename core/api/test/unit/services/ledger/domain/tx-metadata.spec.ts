import { toSats } from "@/domain/bitcoin"
import { UsdDisplayCurrency, toCents } from "@/domain/fiat"
import { LedgerTransactionType } from "@/domain/ledger"
import { WalletCurrency, ZERO_CENTS, ZERO_SATS } from "@/domain/shared"
import {
  LnIntraledgerLedgerMetadata,
  LnTradeIntraAccountLedgerMetadata,
  OnChainIntraledgerLedgerMetadata,
  OnChainTradeIntraAccountLedgerMetadata,
  WalletIdIntraledgerLedgerMetadata,
  WalletIdTradeIntraAccountLedgerMetadata,
  LnSendLedgerMetadata,
  OnChainSendLedgerMetadata,
  OnChainReceiveLedgerMetadata,
  LnReceiveLedgerMetadata,
  LnFeeReimbursementReceiveLedgerMetadata,
  LnFailedPaymentReceiveLedgerMetadata,
} from "@/services/ledger/facade"

describe("Tx metadata", () => {
  const senderUsername = "sender" as Username
  const recipientUsername = "receiver" as Username
  const memoOfPayer = "sample payer memo"
  const pubkey = "pubkey" as Pubkey
  const payeeAddresses: OnChainAddress[] = ["Address" as OnChainAddress]
  const newAddressRequestId: OnChainAddressRequestId =
    "newAddressRequestId" as OnChainAddressRequestId
  const paymentHash = "paymenthash" as PaymentHash
  const onChainTxHash = "onChainTxHash" as OnChainTxHash
  const onChainTxVout = 1 as OnChainTxVout
  const journalId = "journalId" as LedgerJournalId

  const senderAmountDisplayCurrency = 100 as DisplayCurrencyBaseAmount
  const senderFeeDisplayCurrency = 10 as DisplayCurrencyBaseAmount
  const senderDisplayCurrency = "CRC" as DisplayCurrency

  const recipientAmountDisplayCurrency = 15 as DisplayCurrencyBaseAmount
  const recipientFeeDisplayCurrency = 2 as DisplayCurrencyBaseAmount
  const recipientDisplayCurrency = "EUR" as DisplayCurrency

  const paymentAmounts = {
    btcPaymentAmount: { amount: 2000n, currency: WalletCurrency.Btc },
    usdPaymentAmount: { amount: 10n, currency: WalletCurrency.Usd },
    btcProtocolAndBankFee: ZERO_SATS,
    usdProtocolAndBankFee: ZERO_CENTS,
  }

  const startingMetadataArgs = {
    paymentAmounts: paymentAmounts,

    senderAmountDisplayCurrency,
    senderFeeDisplayCurrency,
    senderDisplayCurrency,

    memoOfPayer,
  }

  const expectedCommonMetadata = {
    satsAmount: toSats(2000),
    centsAmount: toCents(10),

    satsFee: toSats(0),
    centsFee: toCents(0),
  }

  const expectedAmounts = {
    internal: {
      displayAmount: Number(
        paymentAmounts.usdPaymentAmount.amount,
      ) as DisplayCurrencyBaseAmount,
      displayFee: Number(
        paymentAmounts.usdProtocolAndBankFee.amount,
      ) as DisplayCurrencyBaseAmount,
      displayCurrency: UsdDisplayCurrency,
    },

    sender: {
      displayAmount: senderAmountDisplayCurrency,
      displayFee: senderFeeDisplayCurrency,
      displayCurrency: senderDisplayCurrency,
    },

    recipient: {
      displayAmount: recipientAmountDisplayCurrency,
      displayFee: recipientFeeDisplayCurrency,
      displayCurrency: recipientDisplayCurrency,
    },
  }

  describe("intraledger", () => {
    const runTest = (testCase: {
      title: string
      commonMetadataArgs:
        | {
            payeeAddresses: OnChainAddress[]
            sendAll: boolean
          }
        | {
            paymentHash: PaymentHash
            pubkey: Pubkey
          }
        | undefined
      /* eslint @typescript-eslint/ban-ts-comment: "off" */
      // @ts-ignore-next-line no-implicit-any error
      expectedCommonMetadata
      // @ts-ignore-next-line no-implicit-any error
      expectedAdditionalDebitMetadata
      crossAccount: {
        // @ts-ignore-next-line no-implicit-any error
        MetadataFn
        title: string
        type: LedgerTransactionType
      }
      selfTrade: {
        // @ts-ignore-next-line no-implicit-any error
        MetadataFn
        title: string
        type: LedgerTransactionType
      }
    }) => {
      describe(`${testCase.title}`, () => {
        const commonMetadataArgs = {
          ...startingMetadataArgs,
          ...testCase.commonMetadataArgs,
        }

        describe(`cross-account (${testCase.crossAccount.title})`, () => {
          const { MetadataFn, type } = testCase.crossAccount

          const metadataArgs = {
            ...commonMetadataArgs,

            recipientAmountDisplayCurrency,
            recipientFeeDisplayCurrency,
            recipientDisplayCurrency,

            senderUsername,
            recipientUsername,
          }

          it("CRC sender", () => {
            const {
              metadata,
              debitAccountAdditionalMetadata,
              creditAccountAdditionalMetadata,
              internalAccountsAdditionalMetadata,
            } = MetadataFn(metadataArgs)

            expect(metadata).toEqual(
              expect.objectContaining({
                ...expectedCommonMetadata,
                ...testCase.expectedCommonMetadata,
                username: senderUsername,
                type,
              }),
            )

            expect(debitAccountAdditionalMetadata).toEqual(
              expect.objectContaining({
                username: recipientUsername,
                ...testCase.expectedAdditionalDebitMetadata,

                ...expectedAmounts.sender,
              }),
            )

            expect(creditAccountAdditionalMetadata).toEqual(
              expect.objectContaining(expectedAmounts.recipient),
            )
            expect(creditAccountAdditionalMetadata).not.toHaveProperty([
              "username",
              "memoPayer",
            ])

            expect(internalAccountsAdditionalMetadata).toEqual(
              expect.objectContaining(expectedAmounts.internal),
            )
            expect(internalAccountsAdditionalMetadata).not.toHaveProperty([
              "username",
              "memoPayer",
            ])
          })

          it("USD sender", () => {
            const {
              debitAccountAdditionalMetadata,
              creditAccountAdditionalMetadata,
              internalAccountsAdditionalMetadata,
            } = MetadataFn({
              ...metadataArgs,
              senderDisplayCurrency: UsdDisplayCurrency,
            })

            expect(debitAccountAdditionalMetadata).toEqual(
              expect.objectContaining({
                ...testCase.expectedAdditionalDebitMetadata,
                ...expectedAmounts.internal,
              }),
            )

            expect(creditAccountAdditionalMetadata).toEqual(
              expect.objectContaining(expectedAmounts.recipient),
            )
            expect(creditAccountAdditionalMetadata).not.toHaveProperty("memoPayer")

            expect(internalAccountsAdditionalMetadata).toEqual(
              expect.objectContaining(expectedAmounts.internal),
            )
            expect(internalAccountsAdditionalMetadata).not.toHaveProperty("memoPayer")
          })

          it("USD recipient", () => {
            const {
              debitAccountAdditionalMetadata,
              creditAccountAdditionalMetadata,
              internalAccountsAdditionalMetadata,
            } = MetadataFn({
              ...metadataArgs,
              recipientDisplayCurrency: UsdDisplayCurrency,
            })

            expect(debitAccountAdditionalMetadata).toEqual(
              expect.objectContaining({
                ...testCase.expectedAdditionalDebitMetadata,
                ...expectedAmounts.sender,
              }),
            )

            expect(creditAccountAdditionalMetadata).toEqual(
              expect.objectContaining(expectedAmounts.internal),
            )
            expect(creditAccountAdditionalMetadata).not.toHaveProperty("memoPayer")

            expect(internalAccountsAdditionalMetadata).toEqual(
              expect.objectContaining(expectedAmounts.internal),
            )
            expect(internalAccountsAdditionalMetadata).not.toHaveProperty("memoPayer")
          })
        })

        describe(`self-trade (${testCase.selfTrade.title})`, () => {
          const { MetadataFn, type } = testCase.selfTrade

          const metadataArgs = commonMetadataArgs

          it("CRC self", () => {
            const {
              metadata,
              debitAccountAdditionalMetadata,
              creditAccountAdditionalMetadata,
              internalAccountsAdditionalMetadata,
            } = MetadataFn(metadataArgs)

            expect(metadata).toEqual(
              expect.objectContaining({
                ...expectedCommonMetadata,
                ...testCase.expectedCommonMetadata,
                type,
              }),
            )

            expect(debitAccountAdditionalMetadata).toEqual(
              expect.objectContaining({
                ...testCase.expectedAdditionalDebitMetadata,
                ...expectedAmounts.sender,
              }),
            )

            expect(creditAccountAdditionalMetadata).toEqual(
              expect.objectContaining(expectedAmounts.sender),
            )
            expect(creditAccountAdditionalMetadata).not.toHaveProperty("memoPayer")

            expect(internalAccountsAdditionalMetadata).toEqual(
              expect.objectContaining(expectedAmounts.internal),
            )
            expect(internalAccountsAdditionalMetadata).not.toHaveProperty("memoPayer")
          })

          it("USD self", () => {
            const {
              metadata,
              debitAccountAdditionalMetadata,
              creditAccountAdditionalMetadata,
              internalAccountsAdditionalMetadata,
            } = MetadataFn({
              ...metadataArgs,
              senderDisplayCurrency: UsdDisplayCurrency,
            })

            expect(metadata).toEqual(
              expect.objectContaining({
                ...expectedCommonMetadata,
                ...testCase.expectedCommonMetadata,
                type,
              }),
            )

            expect(debitAccountAdditionalMetadata).toEqual(
              expect.objectContaining({
                ...testCase.expectedAdditionalDebitMetadata,
                ...expectedAmounts.internal,
              }),
            )

            expect(creditAccountAdditionalMetadata).toEqual(
              expect.objectContaining(expectedAmounts.internal),
            )
            expect(creditAccountAdditionalMetadata).not.toHaveProperty("memoPayer")

            expect(internalAccountsAdditionalMetadata).toEqual(
              expect.objectContaining(expectedAmounts.internal),
            )
            expect(internalAccountsAdditionalMetadata).not.toHaveProperty("memoPayer")
          })
        })
      })
    }

    // Run tests against cases
    const testCases = [
      {
        title: "onchain",
        commonMetadataArgs: {
          payeeAddresses,
          sendAll: true,
        },
        expectedCommonMetadata: { memoPayer: undefined },
        expectedAdditionalDebitMetadata: { memoPayer: memoOfPayer },
        crossAccount: {
          title: "OnChainIntraledgerLedgerMetadata",
          MetadataFn: OnChainIntraledgerLedgerMetadata,
          type: LedgerTransactionType.OnchainIntraLedger,
        },
        selfTrade: {
          title: "OnChainTradeIntraAccountLedgerMetadata",
          MetadataFn: OnChainTradeIntraAccountLedgerMetadata,
          type: LedgerTransactionType.OnChainTradeIntraAccount,
        },
      },

      {
        title: "ln",
        commonMetadataArgs: {
          paymentHash,
          pubkey,
        },
        expectedCommonMetadata: { memoPayer: undefined },
        expectedAdditionalDebitMetadata: { memoPayer: memoOfPayer },
        crossAccount: {
          title: "LnIntraledgerLedgerMetadata",
          MetadataFn: LnIntraledgerLedgerMetadata,
          type: LedgerTransactionType.LnIntraLedger,
        },
        selfTrade: {
          title: "LnTradeIntraAccountLedgerMetadata",
          MetadataFn: LnTradeIntraAccountLedgerMetadata,
          type: LedgerTransactionType.LnTradeIntraAccount,
        },
      },

      {
        title: "walletId",
        commonMetadataArgs: undefined,
        expectedCommonMetadata: { memoPayer: memoOfPayer },
        expectedAdditionalDebitMetadata: {},
        crossAccount: {
          title: "WalletIdIntraledgerLedgerMetadata",
          MetadataFn: WalletIdIntraledgerLedgerMetadata,
          type: LedgerTransactionType.IntraLedger,
        },
        selfTrade: {
          title: "WalletIdTradeIntraAccountLedgerMetadata",
          MetadataFn: WalletIdTradeIntraAccountLedgerMetadata,
          type: LedgerTransactionType.WalletIdTradeIntraAccount,
        },
      },
    ]

    testCases.forEach(runTest)
  })

  describe("external", () => {
    const commonCrcMetadataArgs = {
      paymentAmounts,
      feeDisplayCurrency: expectedAmounts.sender.displayFee,
      amountDisplayCurrency: expectedAmounts.sender.displayAmount,
      displayCurrency: expectedAmounts.sender.displayCurrency,
    }

    const commonUsdMetadataArgs = {
      paymentAmounts,
      feeDisplayCurrency: expectedAmounts.internal.displayFee,
      amountDisplayCurrency: expectedAmounts.internal.displayAmount,
      displayCurrency: expectedAmounts.internal.displayCurrency as DisplayCurrency,
    }

    const sendMetadataArgs = {
      memoOfPayer,
    }
    const expectedSendMetadataArgs = {
      memoPayer: sendMetadataArgs.memoOfPayer,
      pending: true,
    }

    const receiveMetadataArgs = { onChainTxVout }
    const expectedReceiveMetadataArgs = { pending: false }

    const onchainMetadataArgs = {
      onChainTxHash,
      payeeAddresses,
      newAddressRequestId,
    }
    const expectedOnChainSendMetadataArgs = {
      payee_addresses: onchainMetadataArgs.payeeAddresses,
    }

    const expectedOnChainReceiveMetadataArgs = {
      payee_addresses: onchainMetadataArgs.payeeAddresses,
      hash: onChainTxHash,
    }

    const lnMetadataArgs = {
      paymentHash,
      pubkey,
    }

    const expectedLnMetadataArgs = {
      hash: lnMetadataArgs.paymentHash,
    }

    describe("send", () => {
      const expectedMetadata = {
        ...expectedCommonMetadata,
        ...expectedSendMetadataArgs,
      }

      const displayCurrencyCases = [
        {
          commonMetadataArgs: commonUsdMetadataArgs,
          expectedDebitAmounts: expectedAmounts.internal,
        },
        {
          commonMetadataArgs: commonCrcMetadataArgs,
          expectedDebitAmounts: expectedAmounts.sender,
        },
      ]

      describe("onchain", () => {
        describe("OnChainSendLedgerMetadata", () => {
          for (const {
            commonMetadataArgs,
            expectedDebitAmounts,
          } of displayCurrencyCases) {
            it(`${commonMetadataArgs.displayCurrency} sender`, () => {
              const metadataArgs = {
                ...commonMetadataArgs,
                ...sendMetadataArgs,
                ...onchainMetadataArgs,
                sendAll: true,
              }

              const {
                metadata,
                debitAccountAdditionalMetadata,
                internalAccountsAdditionalMetadata,
              } = OnChainSendLedgerMetadata(metadataArgs)

              expect(metadata).toEqual(
                expect.objectContaining({
                  type: LedgerTransactionType.OnchainPayment,
                  ...expectedMetadata,
                  ...expectedOnChainSendMetadataArgs,
                  sendAll: true,
                }),
              )

              expect(debitAccountAdditionalMetadata).toEqual(
                expect.objectContaining(expectedDebitAmounts),
              )

              expect(internalAccountsAdditionalMetadata).toEqual(
                expect.objectContaining(expectedAmounts.internal),
              )
              expect(internalAccountsAdditionalMetadata).not.toHaveProperty(["memoPayer"])
            })
          }
        })
      })

      describe("ln", () => {
        describe("LnSendLedgerMetadata", () => {
          for (const {
            commonMetadataArgs,
            expectedDebitAmounts,
          } of displayCurrencyCases) {
            it(`${commonMetadataArgs.displayCurrency} sender`, () => {
              const metadataArgs = {
                ...commonMetadataArgs,
                ...sendMetadataArgs,
                ...lnMetadataArgs,
                feeKnownInAdvance: true,
              }

              const {
                metadata,
                debitAccountAdditionalMetadata,
                internalAccountsAdditionalMetadata,
              } = LnSendLedgerMetadata(metadataArgs)

              expect(metadata).toEqual(
                expect.objectContaining({
                  type: LedgerTransactionType.Payment,
                  ...expectedMetadata,
                  ...expectedLnMetadataArgs,
                  feeKnownInAdvance: true,
                  pubkey,
                }),
              )

              expect(debitAccountAdditionalMetadata).toEqual(
                expect.objectContaining(expectedDebitAmounts),
              )

              expect(internalAccountsAdditionalMetadata).toEqual(
                expect.objectContaining(expectedAmounts.internal),
              )
              expect(internalAccountsAdditionalMetadata).not.toHaveProperty(["memoPayer"])
            })
          }
        })
      })
    })

    describe("receive", () => {
      const expectedMetadata = {
        ...expectedCommonMetadata,
        ...expectedReceiveMetadataArgs,
      }

      const displayCurrencyCases = [
        {
          commonMetadataArgs: commonUsdMetadataArgs,
          expectedCreditAmounts: expectedAmounts.internal,
        },
        {
          commonMetadataArgs: commonCrcMetadataArgs,
          expectedCreditAmounts: expectedAmounts.sender,
        },
      ]

      describe("onchain", () => {
        describe("OnChainReceiveLedgerMetadata", () => {
          for (const {
            commonMetadataArgs,
            expectedCreditAmounts,
          } of displayCurrencyCases) {
            it(`${commonMetadataArgs.displayCurrency} sender`, () => {
              const metadataArgs = {
                ...commonMetadataArgs,
                ...receiveMetadataArgs,
                ...onchainMetadataArgs,
              }

              const {
                metadata,
                creditAccountAdditionalMetadata,
                internalAccountsAdditionalMetadata,
              } = OnChainReceiveLedgerMetadata(metadataArgs)

              expect(metadata).toEqual(
                expect.objectContaining({
                  type: LedgerTransactionType.OnchainReceipt,
                  ...expectedMetadata,
                  ...expectedOnChainReceiveMetadataArgs,
                }),
              )

              expect(creditAccountAdditionalMetadata).toEqual(
                expect.objectContaining(expectedCreditAmounts),
              )

              expect(internalAccountsAdditionalMetadata).toEqual(
                expect.objectContaining(expectedAmounts.internal),
              )
              expect(internalAccountsAdditionalMetadata).not.toHaveProperty(["memoPayer"])
            })
          }
        })
      })

      describe("ln", () => {
        const lnReceiveCases = [
          {
            title: "LnReceiveLedgerMetadata",
            MetadataFn: LnReceiveLedgerMetadata,
            type: LedgerTransactionType.Invoice,
            expectedAdditionalMetadata: {},
          },
          {
            title: "LnFeeReimbursementReceiveLedgerMetadata",
            MetadataFn: LnFeeReimbursementReceiveLedgerMetadata,
            type: LedgerTransactionType.LnFeeReimbursement,
            expectedAdditionalMetadata: { related_journal: journalId },
          },
          {
            title: "LnFailedPaymentReceiveLedgerMetadata",
            MetadataFn: LnFailedPaymentReceiveLedgerMetadata,
            type: LedgerTransactionType.Payment,
            expectedAdditionalMetadata: { related_journal: journalId },
          },
        ]

        for (const {
          title,
          MetadataFn,
          type,
          expectedAdditionalMetadata,
        } of lnReceiveCases) {
          describe(`${title}`, () => {
            for (const {
              commonMetadataArgs,
              expectedCreditAmounts,
            } of displayCurrencyCases) {
              it(`${commonMetadataArgs.displayCurrency} sender`, () => {
                const metadataArgs = {
                  ...commonMetadataArgs,
                  ...receiveMetadataArgs,
                  ...lnMetadataArgs,
                  journalId,
                }

                const {
                  metadata,
                  creditAccountAdditionalMetadata,
                  internalAccountsAdditionalMetadata,
                } = MetadataFn(metadataArgs)

                expect(metadata).toEqual(
                  expect.objectContaining({
                    type,
                    ...expectedMetadata,
                    ...expectedLnMetadataArgs,
                    ...expectedAdditionalMetadata,
                  }),
                )

                expect(creditAccountAdditionalMetadata).toEqual(
                  expect.objectContaining(expectedCreditAmounts),
                )

                expect(internalAccountsAdditionalMetadata).toEqual(
                  expect.objectContaining(expectedAmounts.internal),
                )
                expect(internalAccountsAdditionalMetadata).not.toHaveProperty([
                  "memoPayer",
                ])
              })
            }
          })
        }
      })
    })
  })
})
