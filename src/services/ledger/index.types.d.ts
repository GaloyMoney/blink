type LedgerMetadata = {
  type: LedgerTransactionType
  pending: boolean
  usd: DisplayCurrencyBaseAmount // to be renamed amountDisplayCurrency
}

type NonIntraledgerLedgerMetadata = LedgerMetadata & {
  fee: Satoshis
  feeUsd: DisplayCurrencyBaseAmount // to be renamed feeDisplayCurrency
}

type LnReceiveLedgerMetadata = NonIntraledgerLedgerMetadata & {
  hash: PaymentHash
}

type OnChainReceiveLedgerMetadata = NonIntraledgerLedgerMetadata & {
  hash: OnChainTxHash
  payee_addresses: OnChainAddress[]
}

type AddLnSendLedgerMetadata = NonIntraledgerLedgerMetadata & {
  hash: PaymentHash
  pubkey: Pubkey
  feeKnownInAdvance: boolean
}

type AddOnchainSendLedgerMetadata = NonIntraledgerLedgerMetadata & {
  hash: OnChainTxHash
  payee_addresses: OnChainAddress[]
  sendAll: boolean
}

type AddColdStorageLedgerMetadata = NonIntraledgerLedgerMetadata & {
  hash: OnChainTxHash
  payee_addresses: OnChainAddress[]
  currency: WalletCurrency
}

type AddColdStorageReceiveLedgerMetadata = AddColdStorageLedgerMetadata

type AddColdStorageSendLedgerMetadata = AddColdStorageLedgerMetadata

type IntraledgerLedgerMetadata = LedgerMetadata & {
  memoPayer: string | null
  username: Username | null
}

type AddLnIntraledgerSendLedgerMetadata = IntraledgerLedgerMetadata & {
  hash: PaymentHash
  pubkey: Pubkey
}

type AddOnChainIntraledgerSendLedgerMetadata = IntraledgerLedgerMetadata & {
  payee_addresses: OnChainAddress[]
  sendAll: boolean
}

type AddWalletIdIntraledgerSendLedgerMetadata = IntraledgerLedgerMetadata

type FeeReimbursementLedgerMetadata = {
  hash: PaymentHash
  type: LedgerTransactionType
  pending: boolean
  usd: DisplayCurrencyBaseAmount
  related_journal: LedgerJournalId
}

type LoadLedgerParams = {
  bankOwnerWalletResolver: () => Promise<WalletId>
  dealerWalletResolver: () => Promise<WalletId>
  funderWalletResolver: () => Promise<WalletId>
}

type ReceiveLedgerMetadata =
  | FeeReimbursementLedgerMetadata
  | LnReceiveLedgerMetadata
  | OnChainReceiveLedgerMetadata
