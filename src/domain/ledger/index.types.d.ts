type LedgerError = import("./errors").LedgerError
type LedgerServiceError = import("./errors").LedgerServiceError

declare const liabilitiesWalletId: unique symbol
type LiabilitiesWalletId = string & { [liabilitiesWalletId]: never }

declare const ledgerTransactionIdSymbol: unique symbol
type LedgerTransactionId = string & { [ledgerTransactionIdSymbol]: never }

declare const ledgerJournalIdSymbol: unique symbol
type LedgerJournalId = string & { [ledgerJournalIdSymbol]: never }

declare const ledgerAccountIdSymbol: unique symbol
type LedgerAccountId = string & { [ledgerAccountIdSymbol]: never }

type LedgerTransactionType =
  typeof import("./index").LedgerTransactionType[keyof typeof import("./index").LedgerTransactionType]

type ExtendedLedgerTransactionType =
  typeof import("./index").ExtendedLedgerTransactionType[keyof typeof import("./index").ExtendedLedgerTransactionType]

type LedgerJournal = {
  readonly journalId: LedgerJournalId
  readonly voided: boolean
  readonly transactionIds: LedgerTransactionId[]
}

// Differentiate fields depending on what 'type' we have (see domain/wallets/index.types.d.ts)
type LedgerTransaction = {
  readonly id: LedgerTransactionId
  readonly walletId: WalletId | null // FIXME create a subclass so that this field is always set for liabilities wallets
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
  readonly recipientWalletId?: WalletId
  readonly username?: Username
  readonly memoFromPayer?: string

  // for ln
  readonly paymentHash?: PaymentHash
  readonly pubkey?: Pubkey
  readonly feeKnownInAdvance: boolean

  // for onchain
  readonly address?: OnChainAddress
  readonly txHash?: OnChainTxHash
}

type ReceiveOnChainTxArgs = {
  liabilitiesWalletId: LiabilitiesWalletId
  txHash: OnChainTxHash
  sats: Satoshis
  fee: Satoshis
  usd: number
  usdFee: number
  receivingAddress: OnChainAddress
}

type TxArgs = {
  liabilitiesWalletId: LiabilitiesWalletId
  description: string
  sats: Satoshis
  fee: Satoshis
  usd: number
  usdFee: number
}

type LnTxArgs = TxArgs & {
  paymentHash: PaymentHash
}

type AddLnTxReceiveArgs = LnTxArgs

type AddLnTxSendArgs = LnTxArgs & {
  pubkey: Pubkey
  feeKnownInAdvance: boolean
}

type IntraledgerTxArgs = {
  liabilitiesWalletId: LiabilitiesWalletId
  description: string
  sats: Satoshis
  recipientLiabilitiesWalletId: LiabilitiesWalletId | null
  payerUsername: Username | null
  recipientUsername: Username | null
  memoPayer: string | null
}

type AddIntraLedgerTxSendArgs = IntraledgerTxArgs & {
  fee: Satoshis
  usd: number
  usdFee: number
}

type AddLnIntraledgerTxSendArgs = AddIntraLedgerTxSendArgs & {
  paymentHash: PaymentHash
  pubkey: Pubkey
}

type AddOnChainIntraledgerTxSendArgs = AddIntraLedgerTxSendArgs & {
  payeeAddresses: OnChainAddress[]
  sendAll: boolean
}

type AddUsernameIntraledgerTxSendArgs = AddIntraLedgerTxSendArgs & {
  recipientUsername: Username
}

type AddLnFeeReeimbursementReceiveArgs = {
  liabilitiesWalletId: LiabilitiesWalletId
  paymentHash: PaymentHash
  sats: Satoshis
  usd: number
  journalId: LedgerJournalId
}

type FeeReimbursement = {
  getReimbursement({ actualFee }: { actualFee: Satoshis }): Satoshis | null
}

type TxVolume = {
  outgoingSats: Satoshis
  incomingSats: Satoshis
}

interface ILedgerService {
  getTransactionById(
    id: LedgerTransactionId,
  ): Promise<LedgerTransaction | LedgerServiceError>

  getTransactionsByHash(
    paymentHash: PaymentHash | OnChainTxHash,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  getLiabilityTransactions(
    liabilitiesWalletId: LiabilitiesWalletId,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  getLiabilityTransactionsForContactUsername(
    liabilitiesWalletId: LiabilitiesWalletId,
    contactUsername: Username,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  listPendingPayments(
    liabilitiesWalletId: LiabilitiesWalletId,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  getPendingPaymentsCount(
    liabilitiesWalletId: LiabilitiesWalletId,
  ): Promise<number | LedgerServiceError>

  getAccountBalance(
    liabilitiesWalletId: LiabilitiesWalletId,
  ): Promise<Satoshis | LedgerServiceError>

  twoFATxVolumeSince({
    liabilitiesWalletId,
    timestamp,
  }: {
    liabilitiesWalletId: LiabilitiesWalletId
    timestamp: Date
  }): Promise<TxVolume | LedgerServiceError>

  withdrawalTxVolumeSince({
    liabilitiesWalletId,
    timestamp,
  }: {
    liabilitiesWalletId: LiabilitiesWalletId
    timestamp: Date
  }): Promise<TxVolume | LedgerServiceError>

  intraledgerTxVolumeSince({
    liabilitiesWalletId,
    timestamp,
  }: {
    liabilitiesWalletId: LiabilitiesWalletId
    timestamp: Date
  }): Promise<TxVolume | LedgerServiceError>

  isOnChainTxRecorded(
    liabilitiesWalletId: LiabilitiesWalletId,
    txHash: OnChainTxHash,
  ): Promise<boolean | LedgerServiceError>

  isLnTxRecorded(paymentHash: PaymentHash): Promise<boolean | LedgerServiceError>

  addOnChainTxReceive(
    args: ReceiveOnChainTxArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  addLnTxReceive(args: AddLnTxReceiveArgs): Promise<LedgerJournal | LedgerServiceError>

  addLnFeeReimbursementReceive(
    args: AddLnFeeReeimbursementReceiveArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  addLnTxSend(args: AddLnTxSendArgs): Promise<LedgerJournal | LedgerServiceError>

  addLnIntraledgerTxSend(
    args: AddLnIntraledgerTxSendArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  addOnChainIntraledgerTxSend(
    args: AddOnChainIntraledgerTxSendArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  addUsernameIntraledgerTxSend(
    args: AddUsernameIntraledgerTxSendArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  settlePendingLnPayments(paymentHash: PaymentHash): Promise<boolean | LedgerServiceError>

  voidLedgerTransactionsForJournal(
    journalId: LedgerJournalId,
  ): Promise<void | LedgerServiceError>
}
