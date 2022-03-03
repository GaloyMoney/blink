declare const ledgerAccountId: unique symbol
type LedgerAccountId = string & { [ledgerAccountId]: never }

type TxMetadata = any

interface MediciEntry {
  credit: (LedgerAccountId, amount: number, extra?: TxMetadata) => MediciEntry
  debit: (LedgerAccountId, amount: number, extra?: TxMetadata) => MediciEntry
}

type StaticAccountIds = {
  bankOwnerAccountId: LedgerAccountId
  dealerBtcAccountId: LedgerAccountId
  dealerUsdAccountId: LedgerAccountId
}

type EntryBuilderConfig<M extends MediciEntry> = {
  entry: M
  staticAccountIds: StaticAccountIds
  metadata: TxMetadata
}

type EntryBuilderDebitState<M extends MediciEntry> = {
  entry: M
  metadata: TxMetadata
  fee: BtcPaymentAmount
  staticAccountIds: StaticAccountIds
}

type EntryBuilderDebit<M extends MediciEntry> = {
  debitAccount: <D extends WalletCurrency>({
    accountId,
    amount,
    additionalMetadata,
  }: {
    accountId: LedgerAccountId
    amount: PaymentAmount<D>
    additionalMetadata?: TxMetadata
  }) => EntryBuilderCredit<M, D>
  debitLnd: (amount: BtcPaymentAmount) => EntryBuilderCreditWithBtcDebit<M>
}

type EntryBuilderCreditWithUsdDebit<M extends MediciEntry> = {
  creditLnd: (amount: BtcPaymentAmount) => M
  creditAccount: ({
    accountId,
    amount,
  }: {
    accountId: LedgerAccountId
    amount?: BtcPaymentAmount
  }) => M
}

type EntryBuilderCreditWithBtcDebit<M extends MediciEntry> = {
  creditLnd: () => M
  creditAccount: ({
    accountId,
    amount,
  }: {
    accountId: LedgerAccountId
    amount?: UsdPaymentAmount
  }) => M
}

type EntryBuilderCredit<M extends MediciEntry, D extends WalletCurrency> = D extends "USD"
  ? EntryBuilderCreditWithUsdDebit<M>
  : EntryBuilderCreditWithBtcDebit<M>

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
