declare const ledgerAccountId: unique symbol
type LedgerAccountId = string & { [ledgerAccountId]: never }

type TxMetadata = any

type LedgerAccountDescriptor<T extends WalletCurrency> = {
  id: LedgerAccountId
  currency: T
}

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

type EntryBuilderFeeState<M extends MediciEntry> = {
  entry: M
  metadata: TxMetadata
  staticAccountIds: StaticAccountIds
  amountWithFee: {
    usdWithFee: UsdPaymentAmount
    btcWithFee: BtcPaymentAmount
  }
}

type EntryBuilderFee<M extends MediciEntry> = {
  withFee: ({
    btcProtocolFee,
    usdProtocolFee,
  }: {
    btcProtocolFee: BtcPaymentAmount
    usdProtocolFee: UsdPaymentAmount
  }) => EntryBuilderDebit<M>
  withFeeFromBank: ({
    btcProtocolFee,
    usdProtocolFee,
  }: {
    btcProtocolFee: BtcPaymentAmount
    usdProtocolFee: UsdPaymentAmount
  }) => EntryBuilderDebit<M>
}

type EntryBuilderDebitState<M extends MediciEntry> = {
  entry: M
  metadata: TxMetadata
  staticAccountIds: StaticAccountIds
  amountWithFee: {
    usdWithFee: UsdPaymentAmount
    btcWithFee: BtcPaymentAmount
  }
  amountWithOutFee: {
    usdWithOutFee: UsdPaymentAmount
    btcWithOutFee: BtcPaymentAmount
  }
}

type EntryBuilderDebit<M extends MediciEntry> = {
  debitAccount: <D extends WalletCurrency>({
    accountDescriptor,
    additionalMetadata,
  }: {
    accountDescriptor: LedgerAccountDescriptor<D>
    additionalMetadata?: TxMetadata
  }) => EntryBuilderCredit<M>
  debitLnd: () => EntryBuilderCredit<M>
  debitColdStorage: () => EntryBuilderCredit<M>
}

type EntryBuilderCreditWithUsdDebit<M extends MediciEntry> = {
  creditLnd: (amount: BtcPaymentAmount) => M
  creditColdStorage: (amount: BtcPaymentAmount) => M
  creditAccount: ({
    accountId,
    btcAmountForUsdDebit,
  }: {
    accountId: LedgerAccountId
    btcAmountForUsdDebit?: BtcPaymentAmount
  }) => M
}

type EntryBuilderCredit<M extends MediciEntry> = {
  creditLnd: () => M
  creditColdStorage: () => M
  creditAccount: <C extends WalletCurrency>(
    accountDescriptor: LedgerAccountDescriptor<C>,
  ) => M
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
