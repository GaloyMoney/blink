import { toSats } from "@domain/bitcoin"
import { DisplayCurrency, toCents } from "@domain/fiat"
import { LedgerTransactionType } from "@domain/ledger"
import { WalletCurrency, ZERO_CENTS, ZERO_SATS } from "@domain/shared"
import {
  LnIntraledgerLedgerMetadata,
  LnTradeIntraAccountLedgerMetadata,
  OnChainIntraledgerLedgerMetadata,
  OnChainTradeIntraAccountLedgerMetadata,
  WalletIdIntraledgerLedgerMetadata,
  WalletIdTradeIntraAccountLedgerMetadata,
} from "@services/ledger/tx-metadata"

describe("Tx metadata", () => {
  const senderUsername = "sender" as Username
  const recipientUsername = "receiver" as Username
  const memoOfPayer = "sample payer memo"
  const pubkey = "pubkey" as Pubkey
  const payeeAddresses: OnChainAddress[] = ["Address" as OnChainAddress]
  const paymentHash = "paymenthash" as PaymentHash

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

  const expectedMetadata = {
    satsAmount: toSats(2000),
    centsAmount: toCents(10),

    satsFee: toSats(0),
    centsFee: toCents(0),
  }

  const expectedAmounts = {
    internal: {
      displayAmount: Number(paymentAmounts.usdPaymentAmount.amount),
      displayFee: Number(paymentAmounts.usdProtocolAndBankFee.amount),
      displayCurrency: DisplayCurrency.Usd,
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
      expectedMetadata
      expectedAdditionalDebitMetadata
      crossAccount: {
        MetadataFn
        type: LedgerTransactionType
      }
      selfTrade: {
        MetadataFn
        type: LedgerTransactionType
      }
    }) => {
      describe(`${testCase.title}`, () => {
        const commonMetadataArgs = {
          ...startingMetadataArgs,
          ...testCase.commonMetadataArgs,
        }

        describe("cross-account", () => {
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
                ...expectedMetadata,
                ...testCase.expectedMetadata,
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
              senderDisplayCurrency: DisplayCurrency.Usd,
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
              recipientDisplayCurrency: DisplayCurrency.Usd,
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

        describe("trade (self-account)", () => {
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
                ...expectedMetadata,
                ...testCase.expectedMetadata,
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
              senderDisplayCurrency: DisplayCurrency.Usd,
            })

            expect(metadata).toEqual(
              expect.objectContaining({
                ...expectedMetadata,
                ...testCase.expectedMetadata,
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
        expectedMetadata: { memoPayer: undefined },
        expectedAdditionalDebitMetadata: { memoPayer: memoOfPayer },
        crossAccount: {
          MetadataFn: OnChainIntraledgerLedgerMetadata,
          type: LedgerTransactionType.OnchainIntraLedger,
        },
        selfTrade: {
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
        expectedMetadata: { memoPayer: undefined },
        expectedAdditionalDebitMetadata: { memoPayer: memoOfPayer },
        crossAccount: {
          MetadataFn: LnIntraledgerLedgerMetadata,
          type: LedgerTransactionType.LnIntraLedger,
        },
        selfTrade: {
          MetadataFn: LnTradeIntraAccountLedgerMetadata,
          type: LedgerTransactionType.LnTradeIntraAccount,
        },
      },

      {
        title: "walletId",
        commonMetadataArgs: undefined,
        expectedMetadata: { memoPayer: memoOfPayer },
        expectedAdditionalDebitMetadata: {},
        crossAccount: {
          MetadataFn: WalletIdIntraledgerLedgerMetadata,
          type: LedgerTransactionType.IntraLedger,
        },
        selfTrade: {
          MetadataFn: WalletIdTradeIntraAccountLedgerMetadata,
          type: LedgerTransactionType.WalletIdTradeIntraAccount,
        },
      },
    ]

    testCases.forEach(runTest)
  })
})
