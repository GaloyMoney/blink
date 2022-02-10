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

type ListByWalletIdArgs = {
  liabilitiesWalletId: LiabilitiesWalletId
  username?: Username
  type?: LedgerTransactionType
  pending?: boolean
}

type IsTxRecordedArgs = {
  hash: PaymentHash | OnChainTxHash
  pending: boolean
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

interface ILedgerExternalService {
  findFromLiabilitiesById(
    id: LedgerTransactionId,
  ): Promise<LedgerTransaction | LedgerServiceError>

  listFromLiabilities(
    hash: PaymentHash | OnChainTxHash,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  listByWalletId(
    args: ListByWalletIdArgs,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  isTxRecorded(args: IsTxRecordedArgs): Promise<boolean | LedgerServiceError>
}
