type LedgerError = import("./errors").LedgerError
type LedgerServiceError = import("./errors").LedgerServiceError

declare const liabilitiesWalletId: unique symbol
type LiabilitiesWalletId = string & { [liabilitiesWalletId]: never }

type LedgerTransactionId = string & { readonly brand: unique symbol }
type LedgerJournalId = string & { readonly brand: unique symbol }
type LedgerAccountId = string & { readonly brand: unique symbol }
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
  readonly currency: WalletCurrency
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
  walletId: WalletId
  txHash: OnChainTxHash
  sats: Satoshis
  fee: Satoshis
  usd: number
  usdFee: number
  receivingAddress: OnChainAddress
}

type TxArgs = {
  walletId: WalletId
  description: string
  sats: Satoshis
  fee: Satoshis
  usd: number
  usdFee: number
}

type LnTxArgs = TxArgs & {
  paymentHash: PaymentHash
}

type OnChainTxArgs = TxArgs & {
  txHash: OnChainTxHash
  payeeAddress: OnChainAddress
}

type AddLnTxReceiveArgs = LnTxArgs

type AddLnTxSendArgs = LnTxArgs & {
  pubkey: Pubkey
  feeKnownInAdvance: boolean
}

type AddOnChainTxSendArgs = OnChainTxArgs & {
  sendAll: boolean
  bankFee: Satoshis
}

type AddColdStorageTxReceiveArgs = {
  txHash: OnChainTxHash
  payeeAddress: OnChainAddress
  description: string
  sats: Satoshis
  fee: Satoshis
  usd: number
  usdFee: number
}

type AddColdStorageTxSendArgs = {
  txHash: OnChainTxHash
  payeeAddress: OnChainAddress
  description: string
  sats: Satoshis
  fee: Satoshis
  usd: number
  usdFee: number
}

type IntraledgerTxArgs = {
  senderWalletId: WalletId
  description: string
  sats: Satoshis
  recipientWalletId: WalletId
  senderUsername: Username | null
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

type addWalletIdIntraledgerTxSendArgs = AddIntraLedgerTxSendArgs

type AddLnFeeReeimbursementReceiveArgs = {
  walletId: WalletId
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

interface IGetVolumeArgs {
  walletId: WalletId
  timestamp: Date
}

type VolumeResult = Promise<TxVolume | LedgerServiceError>

interface ILedgerService {
  getTransactionById(
    id: LedgerTransactionId,
  ): Promise<LedgerTransaction | LedgerServiceError>

  getTransactionsByHash(
    paymentHash: PaymentHash | OnChainTxHash,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  getLiabilityTransactions(
    walletId: WalletId,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  getLiabilityTransactionsForContactUsername(
    walletId: WalletId,
    contactUsername: Username,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  listPendingPayments(
    walletId: WalletId,
  ): Promise<LedgerTransaction[] | LedgerServiceError>

  getPendingPaymentsCount(walletId: WalletId): Promise<number | LedgerServiceError>

  getWalletBalance(walletId: WalletId): Promise<Satoshis | LedgerServiceError>

  allPaymentVolumeSince({ walletId, timestamp }: IGetVolumeArgs): VolumeResult

  externalPaymentVolumeSince({ walletId, timestamp }: IGetVolumeArgs): VolumeResult

  allTxVolumeSince({ walletId, timestamp }: IGetVolumeArgs): VolumeResult

  intraledgerTxVolumeSince({ walletId, timestamp }: IGetVolumeArgs): VolumeResult

  isOnChainTxRecorded({
    walletId,
    txHash,
  }: {
    walletId: WalletId
    txHash: OnChainTxHash
  }): Promise<boolean | LedgerServiceError>

  isToHotWalletTxRecorded(txHash: OnChainTxHash): Promise<boolean | LedgerServiceError>

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

  addOnChainTxSend(
    args: AddOnChainTxSendArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  addOnChainIntraledgerTxSend(
    args: AddOnChainIntraledgerTxSendArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  addWalletIdIntraledgerTxSend(
    args: AddIntraLedgerTxSendArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  settlePendingLnPayments(paymentHash: PaymentHash): Promise<boolean | LedgerServiceError>

  settlePendingOnChainPayments(hash: OnChainTxHash): Promise<boolean | LedgerServiceError>

  voidLedgerTransactionsForJournal(
    journalId: LedgerJournalId,
  ): Promise<void | LedgerServiceError>

  getWalletIdByTransactionHash(hash): Promise<WalletId | LedgerServiceError>

  listWalletIdsWithPendingPayments: () => AsyncGenerator<WalletId> | LedgerServiceError

  addColdStorageTxReceive(
    args: AddColdStorageTxReceiveArgs,
  ): Promise<LedgerJournal | LedgerServiceError>

  addColdStorageTxSend(
    args: AddColdStorageTxSendArgs,
  ): Promise<LedgerJournal | LedgerServiceError>
}

type ActivityCheckerConfig = {
  monthlyVolumeThreshold: Satoshis
  getVolumeFn: (args: IGetVolumeArgs) => VolumeResult
}

type ActivityChecker = {
  aboveThreshold: (walletIds: WalletId[]) => Promise<boolean | LedgerServiceError>
}
