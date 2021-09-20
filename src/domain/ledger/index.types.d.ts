type LedgerError = import("./errors").LedgerError
type LedgerServiceError = import("./errors").LedgerServiceError

declare const liabilitiesAccountId: unique symbol
type LiabilitiesAccountId = string & { [liabilitiesAccountId]: never }

declare const ledgerTransactionIdSymbol: unique symbol
type LedgerTransactionId = string & { [ledgerTransactionIdSymbol]: never }

declare const ledgerJournalIdSymbol: unique symbol
type LedgerJournalId = string & { [ledgerJournalIdSymbol]: never }

declare const ledgerAccountIdSymbol: unique symbol
type LedgerAccountId = string & { [ledgerAccountIdSymbol]: never }

type LedgerTransactionType =
  typeof import("./index").LedgerTransactionType[keyof typeof import("./index").LedgerTransactionType]

type LedgerJournal = {
  readonly journalId: LedgerJournalId
  readonly voided: boolean
  readonly transactionIds: LedgerTransactionId[]
}

// Differentiate fields depending on what 'type' we have (see domain/wallets/index.types.d.ts)
type LedgerTransaction = {
  readonly id: LedgerTransactionId
  readonly type: LedgerTransactionType
  readonly debit: Satoshis
  readonly credit: Satoshis
  readonly fee: Satoshis
  readonly currency: TxDenominationCurrency
  readonly timestamp: Date
  readonly pendingConfirmation: boolean
  readonly journalId: LedgerJournalId

  readonly lnMemo?: string

  readonly usd: number
  readonly feeUsd: number

  // for IntraLedger
  readonly walletName?: WalletName
  readonly memoFromPayer?: string

  // for ln
  readonly paymentHash?: PaymentHash
  readonly pubkey?: Pubkey
  readonly feeKnownInAdvance: boolean

  // for onchain
  readonly addresses?: OnChainAddress[]
  readonly txId?: TxId
}

type ReceiveOnChainTxArgs = {
  liabilitiesAccountId: LiabilitiesAccountId
  txId: TxId
  sats: Satoshis
  fee: Satoshis
  usd: number
  usdFee: number
  receivingAddress: OnChainAddress
}

type TxArgs = {
  liabilitiesAccountId: LiabilitiesAccountId
  description: string
  sats: Satoshis
  fee: Satoshis
  usd: number
  usdFee: number
}

type LnTxArgs = TxArgs & {
  paymentHash: PaymentHash
}

type ReceiveLnTxArgs = LnTxArgs

type SendLnTxArgs = LnTxArgs & {
  pubkey: Pubkey
  feeKnownInAdvance: boolean
}

type IntraledgerTxArgs = {
  liabilitiesAccountId: LiabilitiesAccountId
  description: string
  sats: Satoshis
  recipientLiabilitiesAccountId: LiabilitiesAccountId | null
  payerWalletName: WalletName | null
  recipientWalletName: WalletName | null
  memoPayer: string | null
  shareMemoWithPayee: boolean
}

type SendIntraledgerTxArgs = IntraledgerTxArgs & {
  metadata: SendLnIntraledgerTxMetadata | SendOnChainIntraledgerTxMetadata
}

type SendLnIntraledgerTxArgs = IntraledgerTxArgs & {
  paymentHash: PaymentHash
  fee: Satoshis
  usd: number
  usdFee: number
  pubkey: Pubkey
}

type SendOnChainIntraledgerTxArgs = IntraledgerTxArgs & {
  fee: Satoshis
  usd: number
  usdFee: number
  payeeAddresses: OnChainAddress[]
  sendAll: boolean
}

type TxMetadata = {
  type: LedgerTransactionType
  pending: boolean
  fee: Satoshis
  feeUsd: number
  sats: Satoshis
  usd: number
  currency: Currency
}

type ReceiveLnTxMetadata = TxMetadata & {
  hash: PaymentHash
}

type SendLnTxMetadata = TxMetadata & {
  hash: PaymentHash
  pubkey: Pubkey
  feeKnownInAdvance: boolean
}

type SendLnIntraledgerTxMetadata = TxMetadata & {
  hash: PaymentHash
  pubkey: Pubkey
  memoPayer: string | null
  username: WalletName | null
}

type SendOnChainIntraledgerTxMetadata = TxMetadata & {
  payee_addresses: OnChainAddress[]
  sendAll: boolean
  memoPayer: string | null
  username: WalletName | null
}

type ReceiveLnFeeReeimbursementArgs = {
  liabilitiesAccountId: LiabilitiesAccountId
  paymentHash: PaymentHash
  sats: Satoshis
  usd: number
  journalId: LedgerJournalId
}

type FeeReimbursement = {
  getReimbursement({ actualFee }: { actualFee: Satoshis }): Satoshis | null
}

interface ILedgerService {
  getLiabilityTransactions(
    liabilitiesAccountId: LiabilitiesAccountId,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  getLiabilityTransactionsForContactWalletName(
    liabilitiesAccountId: LiabilitiesAccountId,
    contactWalletName: WalletName,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  listPendingPayments(
    liabilitiesAccountId: LiabilitiesAccountId,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  getPendingPaymentsCount(
    liabilitiesAccountId: LiabilitiesAccountId,
  ): Promise<number | LedgerServiceError>

  getAccountBalance(
    liabilitiesAccountId: LiabilitiesAccountId,
  ): Promise<Satoshis | LedgerServiceError>

  isOnChainTxRecorded(
    liabilitiesAccountId: LiabilitiesAccountId,
    txId: TxId,
  ): Promise<boolean | LedgerServiceError>

  isLnTxRecorded(paymentHash: PaymentHash): Promise<boolean | LedgerServiceError>

  receiveOnChainTx(
    args: ReceiveOnChainTxArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  receiveLnTx(args: ReceiveLnTxArgs): Promise<LedgerJournal | LedgerServiceError>

  receiveLnFeeReimbursement(
    args: ReceiveLnFeeReeimbursementArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  sendLnTx(args: SendLnTxArgs): Promise<LedgerJournal | LedgerServiceError>

  sendLnIntraledgerTx(
    args: SendLnIntraledgerTxArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  sendOnChainIntraledgerTx(
    args: SendOnChainIntraledgerTxArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  settlePendingLiabilityTransactions(
    paymentHash: PaymentHash,
  ): Promise<boolean | LedgerServiceError>

  voidLedgerTransactionsForJournal(
    journalId: LedgerJournalId,
  ): Promise<void | LedgerServiceError>
}
