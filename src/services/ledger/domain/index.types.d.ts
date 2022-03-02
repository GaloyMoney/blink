type LedgerAccountId = string & { [liabilitiesWalletId]: never }

interface MediciEntry {
  credit: (LedgerAccountId, amount: number, extra?: any) => MediciEntry
  debit: (LedgerAccountId, amount: number, extra?: any) => MediciEntry
}

type TxMetadata = any

type EntryBuilderConfig = {
  entry: MediciEntry
  bankOwnerAccountId: LedgerAccountId
  metadata: TxMetadata
}

type PaymentAmount<T extends WalletCurrency> = {
  currency: T
  amount: BigInt
}

type BaseLedgerTransactionMetadata = {
  id: LedgerTransactionId
}

type OnChainLedgerTransactionMetadataUpdate = {
  hash: OnChainTxHash
}

type LnLedgerTransactionMetadataUpdate = {
  hash: PaymentHash
  revealedPreImage?: RevealedPreImage
}

// Repeating 'id' key because can't figure out how to type an empty object
// and have it still work with the '&' below.
type IntraledgerLedgerTransactionMetadataUpdate = { id: LedgerTransactionId }

type LedgerTransactionMetadata = BaseLedgerTransactionMetadata &
  (
    | OnChainLedgerTransactionMetadataUpdate
    | LnLedgerTransactionMetadataUpdate
    | IntraledgerLedgerTransactionMetadataUpdate
  )

interface ITransactionsMetadataRepository {
  updateByHash(
    ledgerTxMetadata:
      | OnChainLedgerTransactionMetadataUpdate
      | LnLedgerTransactionMetadataUpdate,
  ): Promise<true | RepositoryError>

  persistAll(
    ledgerTxsMetadata: LedgerTransactionMetadata[],
  ): Promise<LedgerTransactionMetadata[] | RepositoryError>

  findById(id: LedgerTransactionId): Promise<LedgerTransactionMetadata | RepositoryError>
}
