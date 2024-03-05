type RecordExternalTxTestArgs<S extends WalletCurrency> = {
  walletDescriptor: WalletDescriptor<S>
  paymentAmount: { btc: BtcPaymentAmount; usd: UsdPaymentAmount }
  bankFee: { btc: BtcPaymentAmount; usd: UsdPaymentAmount }
  displayAmounts: {
    amountDisplayCurrency: DisplayCurrencyBaseAmount
    feeDisplayCurrency: DisplayCurrencyBaseAmount
    displayCurrency: DisplayCurrency
  }
  memo?: string
  paymentHash?: PaymentHash
}

type RecordExternalTxTestFn = <S extends WalletCurrency>({
  walletDescriptor,
  paymentAmount,
  bankFee,
  displayAmounts,
}: RecordExternalTxTestArgs<S>) => Promise<LedgerJournal | LedgerError>

type RecordInternalTxTestArgs<S extends WalletCurrency, R extends WalletCurrency> = {
  senderWalletDescriptor: WalletDescriptor<S>
  recipientWalletDescriptor: WalletDescriptor<R>
  paymentAmount: { btc: BtcPaymentAmount; usd: UsdPaymentAmount }
  senderDisplayAmounts: {
    senderAmountDisplayCurrency: DisplayCurrencyBaseAmount
    senderFeeDisplayCurrency: DisplayCurrencyBaseAmount
    senderDisplayCurrency: DisplayCurrency
  }
  recipientDisplayAmounts: {
    recipientAmountDisplayCurrency: DisplayCurrencyBaseAmount
    recipientFeeDisplayCurrency: DisplayCurrencyBaseAmount
    recipientDisplayCurrency: DisplayCurrency
  }
}

type RecordInternalTxTestFn = <S extends WalletCurrency, R extends WalletCurrency>({
  senderWalletDescriptor,
  recipientWalletDescriptor,
  paymentAmount,
  senderDisplayAmounts,
  recipientDisplayAmounts,
}: RecordInternalTxTestArgs<S, R>) => Promise<LedgerJournal | LedgerError>

type RecordOnChainFeeReconciliationArgs = {
  estimatedFee: BtcPaymentAmount
  actualFee: BtcPaymentAmount
  metadata: AddOnChainFeeReconciliationLedgerMetadata
}
