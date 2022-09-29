declare const ledgerAccountId: unique symbol
type LedgerAccountId = string & { [ledgerAccountId]: never }

// eslint-disable-next-line
type TxMetadata = any

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
  metadata: TxMetadata
}

type EntryBuilderFeeState<M extends MediciEntry> = {
  entry: M
  metadata: TxMetadata
  staticAccountIds: StaticAccountIds
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
  staticAccountIds: StaticAccountIds
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
    additionalMetadata?: TxMetadata
  }) => EntryBuilderCredit<M>
  debitLnd: () => EntryBuilderCredit<M>
  debitColdStorage: () => EntryBuilderCredit<M>
}

type EntryBuilderCreditState<M extends MediciEntry> = {
  entry: M
  metadata: TxMetadata
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
}

type EntryBuilderCredit<M extends MediciEntry> = {
  creditLnd: () => M
  creditColdStorage: () => M
  creditAccount: <C extends WalletCurrency>(
    accountDescriptor: LedgerAccountDescriptor<C>,
  ) => M
}

type LegacyEntryBuilderConfig<M extends MediciEntry> = {
  entry: M
  staticAccountIds: StaticAccountIds
  metadata: TxMetadata
}

type LegacyEntryBuilderDebitState<M extends MediciEntry> = {
  entry: M
  metadata: TxMetadata
  fee: BtcPaymentAmount
  staticAccountIds: StaticAccountIds
}

type LegacyEntryBuilderDebit<M extends MediciEntry> = {
  debitAccount: <D extends WalletCurrency>({
    accountId,
    amount,
    additionalMetadata,
  }: {
    accountId: LedgerAccountId
    amount: PaymentAmount<D>
    additionalMetadata?: TxMetadata
  }) => LegacyEntryBuilderCredit<M, D>
  debitLnd: (amount: BtcPaymentAmount) => LegacyEntryBuilderCreditWithBtcDebit<M>
}

type LegacyEntryBuilderCreditState<M extends MediciEntry, D extends WalletCurrency> = {
  entry: M
  metadata: TxMetadata
  fee: BtcPaymentAmount
  debitAmount: PaymentAmount<D>
  staticAccountIds: {
    dealerBtcAccountId: LedgerAccountId
    dealerUsdAccountId: LedgerAccountId
  }
}

type LegacyEntryBuilderCreditWithUsdDebit<M extends MediciEntry> = {
  creditLnd: (amount: BtcPaymentAmount) => M
  creditAccount: ({
    accountId,
    amount,
  }: {
    accountId: LedgerAccountId
    amount?: BtcPaymentAmount
  }) => M
}

type LegacyEntryBuilderCreditWithBtcDebit<M extends MediciEntry> = {
  creditLnd: () => M
  creditAccount: ({
    accountId,
    amount,
  }: {
    accountId: LedgerAccountId
    amount?: UsdPaymentAmount
  }) => M
}

type LegacyEntryBuilderCredit<
  M extends MediciEntry,
  D extends WalletCurrency,
> = D extends "USD"
  ? LegacyEntryBuilderCreditWithUsdDebit<M>
  : LegacyEntryBuilderCreditWithBtcDebit<M>

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

type SwapTransactionMetadataUpdate = {
  hash: SwapHash
  swapAmount: number
  swapId: SwapId
  htlcAddress: OnChainAddress
  onchainMinerFee: number
  offchainRoutingFee: number
  serviceProviderFee: number
  serviceProvider: string
  currency: WalletCurrency
  type: LedgerTransactionType
}

// Repeating 'id' key because can't figure out how to type an empty object
// and have it still work with the '&' below.
type IntraledgerLedgerTransactionMetadataUpdate = { id: LedgerTransactionId }

type LedgerTransactionMetadata = BaseLedgerTransactionMetadata &
  (
    | OnChainLedgerTransactionMetadataUpdate
    | LnLedgerTransactionMetadataUpdate
    | IntraledgerLedgerTransactionMetadataUpdate
    | SwapTransactionMetadataUpdate
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
    hash: PaymentHash | OnChainTxHash | SwapHash,
  ): Promise<LedgerTransactionMetadata | RepositoryError>
}
