declare const ledgerAccountId: unique symbol
type LedgerAccountId = string & { [ledgerAccountId]: never }

type TxMetadata = Record<
  string,
  | string // TODO: add branded type for memo/memoPayer/memoFromPayer and remove this
  | DisplayCurrency
  | Username
  | Satoshis
  | UsdCents
  | DisplayCurrencyBaseAmount
  | boolean
  | OnChainAddress[]
  | OnChainTxVout
  | undefined
>

type LedgerAccountDescriptor<T extends WalletCurrency> = {
  id: LedgerAccountId
  currency: T
}

type MediciEntry = import("../books").MediciEntryFromPackage<ILedgerTransaction>

type StaticAccountIds = {
  bankOwnerAccountId: LedgerAccountId
  dealerBtcAccountId: LedgerAccountId
  dealerUsdAccountId: LedgerAccountId
}

type EntryBuilderConfig<M extends MediciEntry> = {
  entry: M
  staticAccountIds: StaticAccountIds
  externalId?: LedgerExternalId
  metadata: TxMetadata
  additionalInternalMetadata: TxMetadata
}

type EntryBuilderFeeState<M extends MediciEntry> = {
  entry: M
  metadata: TxMetadata
  additionalInternalMetadata: TxMetadata
  staticAccountIds: StaticAccountIds
  externalId: LedgerExternalId | undefined
  amountWithFees: {
    usdWithFees: UsdPaymentAmount
    btcWithFees: BtcPaymentAmount
  }
}

type EntryBuilderFee<M extends MediciEntry> = {
  withBankFee: ({
    btcBankFee,
    usdBankFee,
  }: {
    btcBankFee: BtcPaymentAmount
    usdBankFee: UsdPaymentAmount
  }) => EntryBuilderDebit<M>
}

type EntryBuilderDebitState<M extends MediciEntry> = {
  entry: M
  metadata: TxMetadata
  additionalInternalMetadata: TxMetadata
  staticAccountIds: StaticAccountIds
  externalId: LedgerExternalId | undefined
  amountWithFees: {
    usdWithFees: UsdPaymentAmount
    btcWithFees: BtcPaymentAmount
  }
  bankFee: {
    btcBankFee: BtcPaymentAmount
    usdBankFee: UsdPaymentAmount
  }
}

type EntryBuilderDebit<M extends MediciEntry> = {
  debitAccount: <D extends WalletCurrency>({
    accountDescriptor,
    additionalMetadata,
  }: {
    accountDescriptor: LedgerAccountDescriptor<D>
    additionalMetadata: TxMetadata
  }) => EntryBuilderCredit<M>
  debitOffChain: () => EntryBuilderCredit<M>
  debitOnChain: () => EntryBuilderCredit<M>
  debitColdStorage: () => EntryBuilderCredit<M>
}

type EntryBuilderCreditState<M extends MediciEntry> = {
  entry: M
  metadata: TxMetadata
  additionalInternalMetadata: TxMetadata
  debitCurrency: WalletCurrency
  amountWithFees: {
    usdWithFees: UsdPaymentAmount
    btcWithFees: BtcPaymentAmount
  }
  bankFee: {
    usdBankFee: UsdPaymentAmount
    btcBankFee: BtcPaymentAmount
  }
  staticAccountIds: {
    dealerBtcAccountId: LedgerAccountId
    dealerUsdAccountId: LedgerAccountId
  }
  externalId: LedgerExternalId | undefined
}

type EntryBuilderCredit<M extends MediciEntry> = {
  creditOffChain: () => M
  creditOnChain: () => M
  creditColdStorage: () => M
  creditAccount: <C extends WalletCurrency>({
    accountDescriptor,
    additionalMetadata,
  }: {
    accountDescriptor: LedgerAccountDescriptor<C>
    additionalMetadata: TxMetadata
  }) => M
}

type FeeOnlyEntryBuilderConfig<M extends MediciEntry> = {
  entry: M
  metadata: TxMetadata
  staticAccountIds: {
    bankOwnerAccountId: LedgerAccountId
  }
  btcFee: BtcPaymentAmount
}

type FeeOnlyEntryBuilderDebit<M extends MediciEntry> = {
  debitBankOwner: () => FeeOnlyEntryBuilderCredit<M>
  debitOnChain: () => FeeOnlyEntryBuilderCredit<M>
}

type FeeOnlyEntryBuilderCredit<M extends MediciEntry> = {
  creditBankOwner: () => M
  creditOnChain: () => M
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

  findByHash(
    hash: PaymentHash | OnChainTxHash,
  ): Promise<LedgerTransactionMetadata | RepositoryError>

  listByIds(
    ids: LedgerTransactionId[],
  ): Promise<(LedgerTransactionMetadata | RepositoryError)[] | RepositoryError>
}
