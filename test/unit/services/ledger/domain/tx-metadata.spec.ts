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
  const paymentAmounts = {
    btcPaymentAmount: receiveAmount.btc,
    usdPaymentAmount: receiveAmount.usd,
    btcProtocolAndBankFee: ZERO_SATS,
    usdProtocolAndBankFee: ZERO_CENTS,
  }

  const onChainPaymentAmounts = {
    btcPaymentAmount: receiveAmount.btc,
    usdPaymentAmount: receiveAmount.usd,
    btcProtocolAndBankFee: ZERO_SATS,
    usdProtocolAndBankFee: ZERO_CENTS,
  }

  describe("intraledger", () => {
    const senderAmountDisplayCurrency = amountDisplayCurrency
    const senderFeeDisplayCurrency = feeDisplayCurrency
    const senderDisplayCurrency = displayCurrency

    const recipientAmountDisplayCurrency = (amountDisplayCurrency +
      1) as DisplayCurrencyBaseAmount
    const recipientFeeDisplayCurrency = (feeDisplayCurrency +
      1) as DisplayCurrencyBaseAmount
    const recipientDisplayCurrency = displayCurrency

    it("onchain", () => {
      const {
        metadata,
        debitAccountAdditionalMetadata,
        creditAccountAdditionalMetadata,
      } = OnChainIntraledgerLedgerMetadata({
        payeeAddresses,
        sendAll: true,
        paymentAmounts: onChainPaymentAmounts,

        senderAmountDisplayCurrency,
        senderFeeDisplayCurrency,
        senderDisplayCurrency,

        recipientAmountDisplayCurrency,
        recipientFeeDisplayCurrency,
        recipientDisplayCurrency,

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

          displayAmount: senderAmountDisplayCurrency,
          displayFee: senderFeeDisplayCurrency,
          displayCurrency: senderDisplayCurrency,
        }),
      )

      expect(creditAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          displayAmount: recipientAmountDisplayCurrency,
          displayFee: recipientFeeDisplayCurrency,
          displayCurrency: recipientDisplayCurrency,
        }),
      )
    })
    it("onchain trade", () => {
      const {
        metadata,
        debitAccountAdditionalMetadata,
        creditAccountAdditionalMetadata,
      } = OnChainTradeIntraAccountLedgerMetadata({
        payeeAddresses,
        sendAll: true,
        paymentAmounts: onChainPaymentAmounts,

        senderAmountDisplayCurrency,
        senderFeeDisplayCurrency,
        senderDisplayCurrency,

        recipientAmountDisplayCurrency,
        recipientFeeDisplayCurrency,
        recipientDisplayCurrency,

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

          displayAmount: senderAmountDisplayCurrency,
          displayFee: senderFeeDisplayCurrency,
          displayCurrency: senderDisplayCurrency,
        }),
      )

      expect(creditAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          displayAmount: recipientAmountDisplayCurrency,
          displayFee: recipientFeeDisplayCurrency,
          displayCurrency: recipientDisplayCurrency,
        }),
      )
    })

    it("ln", () => {
      const {
        metadata,
        debitAccountAdditionalMetadata,
        creditAccountAdditionalMetadata,
      } = LnIntraledgerLedgerMetadata({
        paymentHash,
        pubkey,
        paymentAmounts,

        senderAmountDisplayCurrency,
        senderFeeDisplayCurrency,
        senderDisplayCurrency,

        recipientAmountDisplayCurrency,
        recipientFeeDisplayCurrency,
        recipientDisplayCurrency,

        memoOfPayer,
        senderUsername,
        recipientUsername,
      })

      expect(metadata).toEqual(
        expect.objectContaining({
          username: senderUsername,
          memoPayer: undefined,
          type: LedgerTransactionType.LnIntraLedger,

          satsFee: toSats(0),

          centsAmount: toCents(10),
          satsAmount: toSats(2000),
          centsFee: toCents(0),
        }),
      )

      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          username: recipientUsername,
          memoPayer: memoOfPayer,

          displayAmount: senderAmountDisplayCurrency,
          displayFee: senderFeeDisplayCurrency,
          displayCurrency: senderDisplayCurrency,
        }),
      )

      expect(creditAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          displayAmount: recipientAmountDisplayCurrency,
          displayFee: recipientFeeDisplayCurrency,
          displayCurrency: recipientDisplayCurrency,
        }),
      )
    })

    it("ln trade", () => {
      const {
        metadata,
        debitAccountAdditionalMetadata,
        creditAccountAdditionalMetadata,
      } = LnTradeIntraAccountLedgerMetadata({
        paymentHash,
        pubkey,
        paymentAmounts,

        senderAmountDisplayCurrency,
        senderFeeDisplayCurrency,
        senderDisplayCurrency,

        recipientAmountDisplayCurrency,
        recipientFeeDisplayCurrency,
        recipientDisplayCurrency,

        memoOfPayer,
      })

      expect(metadata).toEqual(
        expect.objectContaining({
          memoPayer: undefined,
          type: LedgerTransactionType.LnTradeIntraAccount,

          satsFee: toSats(0),

          centsAmount: toCents(10),
          satsAmount: toSats(2000),
          centsFee: toCents(0),
        }),
      )

      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          memoPayer: memoOfPayer,

          displayAmount: senderAmountDisplayCurrency,
          displayFee: senderFeeDisplayCurrency,
          displayCurrency: senderDisplayCurrency,
        }),
      )

      expect(creditAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          displayAmount: recipientAmountDisplayCurrency,
          displayFee: recipientFeeDisplayCurrency,
          displayCurrency: recipientDisplayCurrency,
        }),
      )
    })

    it("wallet id", () => {
      const {
        metadata,
        debitAccountAdditionalMetadata,
        creditAccountAdditionalMetadata,
      } = WalletIdIntraledgerLedgerMetadata({
        paymentAmounts,

        senderAmountDisplayCurrency,
        senderFeeDisplayCurrency,
        senderDisplayCurrency,

        recipientAmountDisplayCurrency,
        recipientFeeDisplayCurrency,
        recipientDisplayCurrency,

        memoOfPayer,
        senderUsername,
        recipientUsername,
      })

      expect(metadata).toEqual(
        expect.objectContaining({
          username: senderUsername,
          memoPayer: memoOfPayer,
          type: LedgerTransactionType.IntraLedger,

          satsFee: toSats(0),

          centsAmount: toCents(10),
          satsAmount: toSats(2000),
          centsFee: toCents(0),
        }),
      )

      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          username: recipientUsername,

          displayAmount: senderAmountDisplayCurrency,
          displayFee: senderFeeDisplayCurrency,
          displayCurrency: senderDisplayCurrency,
        }),
      )

      expect(creditAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          displayAmount: recipientAmountDisplayCurrency,
          displayFee: recipientFeeDisplayCurrency,
          displayCurrency: recipientDisplayCurrency,
        }),
      )
    })

    it("wallet id trade", () => {
      const {
        metadata,
        debitAccountAdditionalMetadata,
        creditAccountAdditionalMetadata,
      } = WalletIdTradeIntraAccountLedgerMetadata({
        paymentAmounts,

        senderAmountDisplayCurrency,
        senderFeeDisplayCurrency,
        senderDisplayCurrency,

        recipientAmountDisplayCurrency,
        recipientFeeDisplayCurrency,
        recipientDisplayCurrency,

        memoOfPayer,
      })

      expect(metadata).toEqual(
        expect.objectContaining({
          memoPayer: memoOfPayer,
          type: LedgerTransactionType.WalletIdTradeIntraAccount,

          satsFee: toSats(0),

          centsAmount: toCents(10),
          satsAmount: toSats(2000),
          centsFee: toCents(0),
        }),
      )

      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          displayAmount: senderAmountDisplayCurrency,
          displayFee: senderFeeDisplayCurrency,
          displayCurrency: senderDisplayCurrency,
        }),
      )

      expect(creditAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          displayAmount: recipientAmountDisplayCurrency,
          displayFee: recipientFeeDisplayCurrency,
          displayCurrency: recipientDisplayCurrency,
        }),
      )
    })
  })
})
