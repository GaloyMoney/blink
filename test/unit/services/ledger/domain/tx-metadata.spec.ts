import { DisplayCurrency } from "@domain/fiat"
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
  const usd = amountDisplayCurrency / 100
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

  const expectedMetadataAmounts = {
    satsAmount: Number(paymentAmounts.btcPaymentAmount.amount),
    satsFee: Number(paymentAmounts.btcProtocolAndBankFee.amount),
    centsAmount: Number(paymentAmounts.usdPaymentAmount.amount),
    centsFee: Number(paymentAmounts.usdProtocolAndBankFee.amount),
    displayAmount: Number(paymentAmounts.usdPaymentAmount.amount),
    displayFee: Number(paymentAmounts.usdProtocolAndBankFee.amount),
    displayCurrency: "USD",
  }

  describe("intraledger", () => {
    it("onchain: OnChainIntraledgerLedgerMetadata", () => {
      const { metadata, debitAccountAdditionalMetadata } =
        OnChainIntraledgerLedgerMetadata({
          payeeAddresses,
          sendAll: true,
          paymentAmounts,

          amountDisplayCurrency,
          feeDisplayCurrency,
          displayCurrency,

          memoOfPayer,
          senderUsername,
          recipientUsername,
        })

      expect(metadata).toEqual(
        expect.objectContaining({
          ...expectedMetadataAmounts,
          type: LedgerTransactionType.OnchainIntraLedger,

          username: senderUsername,
          memoPayer: undefined,

          usd,
        }),
      )
      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          username: recipientUsername,
          memoPayer: memoOfPayer,
        }),
      )
    })

    it("ln: LnIntraledgerLedgerMetadata", () => {
      const { metadata, debitAccountAdditionalMetadata } = LnIntraledgerLedgerMetadata({
        paymentHash,
        pubkey,
        paymentAmounts,

        amountDisplayCurrency,
        feeDisplayCurrency,
        displayCurrency,

        memoOfPayer,
        senderUsername,
        recipientUsername,
      })

      expect(metadata).toEqual(
        expect.objectContaining({
          ...expectedMetadataAmounts,
          type: LedgerTransactionType.LnIntraLedger,

          username: senderUsername,
          memoPayer: undefined,

          usd,
        }),
      )
      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          username: recipientUsername,
          memoPayer: memoOfPayer,
        }),
      )
    })

    it("wallet id: WalletIdIntraledgerLedgerMetadata", () => {
      const { metadata, debitAccountAdditionalMetadata } =
        WalletIdIntraledgerLedgerMetadata({
          paymentAmounts,

          feeDisplayCurrency,
          amountDisplayCurrency,
          displayCurrency,

          memoOfPayer,
          senderUsername,
          recipientUsername,
        })

      expect(metadata).toEqual(
        expect.objectContaining({
          ...expectedMetadataAmounts,
          type: LedgerTransactionType.IntraLedger,

          username: senderUsername,
          memoPayer: memoOfPayer,

          usd,
        }),
      )
      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          username: recipientUsername,
        }),
      )
    })
  })

  describe("intraledger trade", () => {
    it("onchain trade: OnChainTradeIntraAccountLedgerMetadata", () => {
      const { metadata, debitAccountAdditionalMetadata } =
        OnChainTradeIntraAccountLedgerMetadata({
          payeeAddresses,
          sendAll: true,
          paymentAmounts,

          amountDisplayCurrency,
          feeDisplayCurrency,
          displayCurrency,

          memoOfPayer,
        })

      expect(metadata).toEqual(
        expect.objectContaining({
          ...expectedMetadataAmounts,
          type: LedgerTransactionType.OnChainTradeIntraAccount,

          memoPayer: undefined,

          usd,
        }),
      )
      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          memoPayer: memoOfPayer,
        }),
      )
    })

    it("ln trade: LnTradeIntraAccountLedgerMetadata", () => {
      const { metadata, debitAccountAdditionalMetadata } =
        LnTradeIntraAccountLedgerMetadata({
          paymentHash,
          pubkey,
          paymentAmounts,

          amountDisplayCurrency,
          feeDisplayCurrency,
          displayCurrency,

          memoOfPayer,
        })

      expect(metadata).toEqual(
        expect.objectContaining({
          ...expectedMetadataAmounts,
          type: LedgerTransactionType.LnTradeIntraAccount,

          memoPayer: undefined,

          usd,
        }),
      )
      expect(debitAccountAdditionalMetadata).toEqual(
        expect.objectContaining({
          memoPayer: memoOfPayer,
        }),
      )
    })

    it("wallet id trade: WalletIdTradeIntraAccountLedgerMetadata", () => {
      const metadata = WalletIdTradeIntraAccountLedgerMetadata({
        paymentAmounts,

        feeDisplayCurrency,
        amountDisplayCurrency,
        displayCurrency,

        memoOfPayer,
      })

      expect(metadata).toEqual(
        expect.objectContaining({
          memoPayer: memoOfPayer,
          ...expectedMetadataAmounts,
          type: LedgerTransactionType.WalletIdTradeIntraAccount,

          usd,
        }),
      )
    })
  })
})
