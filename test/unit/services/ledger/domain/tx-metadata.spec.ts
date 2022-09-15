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
  const amountDisplayCurrency = 10 as DisplayCurrencyBaseAmount
  const feeDisplayCurrency = 0 as DisplayCurrencyBaseAmount
  const displayCurrency = DisplayCurrency.Usd

  const receiveAmount = {
    usd: { amount: 10n, currency: WalletCurrency.Usd },
    btc: { amount: 2000n, currency: WalletCurrency.Btc },
  }
  const paymentFlow = {
    btcPaymentAmount: receiveAmount.btc,
    usdPaymentAmount: receiveAmount.usd,
    btcProtocolFee: ZERO_SATS,
    usdProtocolFee: ZERO_CENTS,
  } as PaymentFlowState<WalletCurrency, WalletCurrency>

  describe("intraledger", () => {
    it("onchain", () => {
      const { metadata, debitAccountAdditionalMetadata } =
        OnChainIntraledgerLedgerMetadata({
          amountDisplayCurrency,
          payeeAddresses,
          sendAll: true,
          memoOfPayer,
          senderUsername,
          recipientUsername,
        })

      expect(metadata).toEqual(
        expect.objectContaining({
          username: senderUsername,
          memoPayer: undefined,
          type: LedgerTransactionType.OnchainIntraLedger,
        }),
      )
      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          username: recipientUsername,
          memoPayer: memoOfPayer,
        }),
      )
    })
    it("onchain trade", () => {
      const { metadata, debitAccountAdditionalMetadata } =
        OnChainTradeIntraAccountLedgerMetadata({
          amountDisplayCurrency,
          payeeAddresses,
          sendAll: true,
          memoOfPayer,
        })

      expect(metadata).toEqual(
        expect.objectContaining({
          memoPayer: undefined,
          type: LedgerTransactionType.OnChainTradeIntraAccount,
        }),
      )
      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          memoPayer: memoOfPayer,
        }),
      )
    })

    it("ln", () => {
      const { metadata, debitAccountAdditionalMetadata } = LnIntraledgerLedgerMetadata({
        paymentHash,
        pubkey,
        paymentFlow,

        amountDisplayCurrency,
        feeDisplayCurrency,
        displayCurrency,

        memoOfPayer,
        senderUsername,
        recipientUsername,
      })

      expect(metadata).toEqual(
        expect.objectContaining({
          username: senderUsername,
          memoPayer: undefined,
          type: LedgerTransactionType.LnIntraLedger,

          usd: (amountDisplayCurrency / 100) as DisplayCurrencyBaseAmount,

          satsFee: toSats(0),
          displayFee: feeDisplayCurrency,
          displayAmount: amountDisplayCurrency,

          displayCurrency,
          centsAmount: toCents(10),
          satsAmount: toSats(2000),
          centsFee: toCents(0),
        }),
      )
      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          username: recipientUsername,
          memoPayer: memoOfPayer,
        }),
      )
    })

    it("ln trade", () => {
      const { metadata, debitAccountAdditionalMetadata } =
        LnTradeIntraAccountLedgerMetadata({
          paymentHash,
          pubkey,
          paymentFlow,

          amountDisplayCurrency,
          feeDisplayCurrency,
          displayCurrency,

          memoOfPayer,
        })

      expect(metadata).toEqual(
        expect.objectContaining({
          memoPayer: undefined,
          type: LedgerTransactionType.LnTradeIntraAccount,

          usd: (amountDisplayCurrency / 100) as DisplayCurrencyBaseAmount,

          satsFee: toSats(0),
          displayFee: feeDisplayCurrency,
          displayAmount: amountDisplayCurrency,

          displayCurrency,
          centsAmount: toCents(10),
          satsAmount: toSats(2000),
          centsFee: toCents(0),
        }),
      )
      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          memoPayer: memoOfPayer,
        }),
      )
    })

    it("wallet id", () => {
      const { metadata, debitAccountAdditionalMetadata } =
        WalletIdIntraledgerLedgerMetadata({
          paymentFlow,

          feeDisplayCurrency,
          amountDisplayCurrency,
          displayCurrency,

          memoOfPayer,
          senderUsername,
          recipientUsername,
        })

      expect(metadata).toEqual(
        expect.objectContaining({
          username: senderUsername,
          memoPayer: memoOfPayer,
          type: LedgerTransactionType.IntraLedger,

          usd: (amountDisplayCurrency / 100) as DisplayCurrencyBaseAmount,

          satsFee: toSats(0),
          displayFee: feeDisplayCurrency,
          displayAmount: amountDisplayCurrency,

          displayCurrency,
          centsAmount: toCents(10),
          satsAmount: toSats(2000),
          centsFee: toCents(0),
        }),
      )
      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          username: recipientUsername,
        }),
      )
    })

    it("wallet id trade", () => {
      const metadata = WalletIdTradeIntraAccountLedgerMetadata({
        paymentFlow,

        feeDisplayCurrency,
        amountDisplayCurrency,
        displayCurrency,

        memoOfPayer,
      })

      expect(metadata).toEqual(
        expect.objectContaining({
          memoPayer: memoOfPayer,
          type: LedgerTransactionType.WalletIdTradeIntraAccount,

          usd: (amountDisplayCurrency / 100) as DisplayCurrencyBaseAmount,

          satsFee: toSats(0),
          displayFee: feeDisplayCurrency,
          displayAmount: amountDisplayCurrency,

          displayCurrency,
          centsAmount: toCents(10),
          satsAmount: toSats(2000),
          centsFee: toCents(0),
        }),
      )
    })
  })
})
