type LedgerTransactionMetadata = {
  hash?: PaymentHash | OnChainTxHash
  revealedPreImage?: RevealedPreImage
}
type LedgerTransactionMetadataWithHash = Omit<LedgerTransactionMetadata, "hash"> & {
  hash: PaymentHash | OnChainTxHash
}

type PersistNewLedgerTransactionMetadataArgs = {
  id: LedgerTransactionId
  ledgerTxMetadata: LedgerTransactionMetadata
}

interface ITransactionsMetadataRepository {
  updateByHash(
    ledgerTxMetadata: LedgerTransactionMetadataWithHash,
  ): Promise<true | RepositoryError>
  persistnew(
    args: PersistNewLedgerTransactionMetadataArgs,
  ): Promise<LedgerTransactionMetadata | RepositoryError>
  findById(id: LedgerTransactionId): Promise<LedgerTransactionMetadata | RepositoryError>
}
