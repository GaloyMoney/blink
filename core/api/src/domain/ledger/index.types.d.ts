type LedgerError = import("./errors").LedgerError
type FeeDifferenceError = import("./errors").FeeDifferenceError
type LedgerServiceError = import("./errors").LedgerServiceError
type InvalidLnPaymentTxnsBundleError = import("./errors").InvalidLnPaymentTxnsBundleError

declare const liabilitiesWalletId: unique symbol
type LiabilitiesWalletId = string & { [liabilitiesWalletId]: never }

type LedgerTransactionId = string & { readonly brand: unique symbol }
type LedgerJournalId = string & { readonly brand: unique symbol }

type AdminLedgerTransactionTypeObject =
  typeof import("./index").AdminLedgerTransactionType
type AdminLedgerTransactionTypeKey =
  keyof typeof import("./index").AdminLedgerTransactionType
type AdminLedgerTransactionType =
  AdminLedgerTransactionTypeObject[AdminLedgerTransactionTypeKey]

type LedgerTransactionTypeObject = typeof import("./index").LedgerTransactionType
type LedgerTransactionTypeKey = keyof typeof import("./index").LedgerTransactionType
type LedgerTransactionType = LedgerTransactionTypeObject[LedgerTransactionTypeKey]

type LedgerJournal = {
  readonly journalId: LedgerJournalId
  readonly voided: boolean
  readonly transactionIds: LedgerTransactionId[]
}

// Differentiate fields depending on what 'type' we have (see domain/wallets/index.types.d.ts)
type LedgerTransaction<S extends WalletCurrency> = {
  readonly id: LedgerTransactionId
  readonly walletId: WalletId | undefined // FIXME create a subclass so that this field is always set for liabilities wallets
  readonly type: LedgerTransactionType
  readonly debit: Satoshis | UsdCents
  readonly credit: Satoshis | UsdCents
  readonly currency: S
  readonly timestamp: Date
  readonly pendingConfirmation: boolean
  readonly journalId: LedgerJournalId
  readonly voided: boolean

  readonly lnMemo?: string

  // for IntraLedger
  readonly recipientWalletId?: WalletId
  readonly username?: Username
  readonly memoFromPayer?: string

  // for ln
  readonly paymentHash?: PaymentHash
  readonly pubkey?: Pubkey
  readonly feeKnownInAdvance: boolean
  readonly lnPaymentState?: LnPaymentState

  readonly satsAmount?: Satoshis
  readonly centsAmount?: UsdCents
  readonly satsFee?: Satoshis
  readonly centsFee?: UsdCents

  readonly displayAmount?: DisplayCurrencyBaseAmount
  readonly displayFee?: DisplayCurrencyBaseAmount
  readonly displayCurrency?: DisplayCurrency

  // for onchain
  readonly address?: OnChainAddress
  readonly txHash?: OnChainTxHash
  readonly vout?: OnChainTxVout
  readonly requestId?: OnChainAddressRequestId
  readonly payoutId?: PayoutId

  // for admin, to be removed when we switch those to satsAmount props
  readonly fee: number | undefined // Satoshis
  readonly usd: number | undefined
  readonly feeUsd: number | undefined
}

type TxArgs = {
  walletId: WalletId
  walletCurrency: WalletCurrency
  description: string
  sats: Satoshis
  amountDisplayCurrency: DisplayCurrencyBaseAmount
}

type LnTxArgs = TxArgs & {
  paymentHash: PaymentHash
}

type OnChainTxArgs = TxArgs & {
  txHash: OnChainTxHash
  payeeAddress: OnChainAddress
}

type AddLnTxSendArgs = LnTxArgs & {
  cents?: UsdCents // move in upper property?
  pubkey: Pubkey
  feeKnownInAdvance: boolean
  feeRouting: Satoshis
  feeRoutingDisplayCurrency: DisplayCurrencyBaseAmount
}

type AddOnChainTxSendArgs = OnChainTxArgs & {
  sendAll: boolean
  totalFee: Satoshis
  bankFee: Satoshis
  totalFeeDisplayCurrency: DisplayCurrencyBaseAmount
}

type SetOnChainTxPayoutIdArgs = {
  journalId: LedgerJournalId
  payoutId: PayoutId
}

type SetOnChainTxIdByPayoutIdArgs = {
  payoutId: PayoutId
  txId: OnChainTxHash
  vout: OnChainTxVout
}

type AddColdStorageTxReceiveArgs<T extends DisplayCurrency> = {
  txHash: OnChainTxHash
  payeeAddress: OnChainAddress
  description: string
  sats: Satoshis
  fee: Satoshis
  amountDisplayCurrency: DisplayAmount<T>
  feeDisplayCurrency: DisplayAmount<T>
}

type AddColdStorageTxSendArgs<T extends DisplayCurrency> = {
  txHash: OnChainTxHash
  payeeAddress: OnChainAddress
  description: string
  sats: Satoshis
  fee: Satoshis
  amountDisplayCurrency: DisplayAmount<T>
  feeDisplayCurrency: DisplayAmount<T>
}

type IntraledgerTxArgs = {
  senderWalletId: WalletId
  senderWalletCurrency: WalletCurrency
  senderUsername?: Username
  description: string
  sats?: Satoshis
  cents?: UsdCents
  recipientWalletId: WalletId
  recipientWalletCurrency: WalletCurrency
  recipientUsername?: Username
  memoPayer?: string
}

type AddIntraLedgerTxSendArgs = IntraledgerTxArgs & {
  amountDisplayCurrency: DisplayCurrencyBaseAmount
}

type SendIntraledgerTxArgs = IntraledgerTxArgs & {
  recipientUsername?: Username
  shareMemoWithPayee: boolean
  metadata:
    | AddLnIntraledgerSendLedgerMetadata
    | AddOnChainIntraledgerSendLedgerMetadata
    | AddWalletIdIntraledgerSendLedgerMetadata
  paymentHash?: PaymentHash
}

type AddLnIntraledgerTxTransferArgs = AddIntraLedgerTxSendArgs & {
  paymentHash: PaymentHash
  pubkey: Pubkey
}

type AddOnChainIntraledgerTxTransferArgs = AddIntraLedgerTxSendArgs & {
  payeeAddresses: OnChainAddress[]
  sendAll: boolean
}

type AddWalletIdIntraledgerTxTransferArgs = AddIntraLedgerTxSendArgs

type FeeReimbursement = {
  getReimbursement(
    actualFee: BtcPaymentAmount,
  ): PaymentAmountInAllCurrencies | FeeDifferenceError
}

type TxBaseVolume = {
  outgoingBaseAmount: CurrencyBaseAmount
  incomingBaseAmount: CurrencyBaseAmount
}

type TxBaseVolumeAmount<S extends WalletCurrency> = {
  outgoingBaseAmount: PaymentAmount<S>
  incomingBaseAmount: PaymentAmount<S>
}

type TxCentsVolume = {
  outgoingCents: UsdCents
  incomingCents: UsdCents
}

interface IGetVolumeArgs {
  walletId: WalletId
  timestamp: Date
}

interface IGetVolumeAmountArgs<T extends WalletCurrency> {
  walletDescriptor: WalletDescriptor<T>
  timestamp: Date
}

type GetVolumeAmountSinceFn = <S extends WalletCurrency>(
  args: IGetVolumeAmountArgs<S>,
) => Promise<TxBaseVolumeAmount<S> | LedgerServiceError>

type NewGetVolumeAmountSinceFn = <S extends WalletCurrency>(
  args: IGetVolumeAmountArgs<S>,
) => Promise<PaymentAmount<S> | LedgerServiceError>

type RevertLightningPaymentArgs = {
  journalId: LedgerJournalId
  paymentHash: PaymentHash
}

type RevertOnChainPaymentArgs = {
  journalId: LedgerJournalId
  description?: string
}

type IsOnChainReceiptTxRecordedForWalletResult = {
  recorded: boolean
  newAddressRequestId: OnChainAddressRequestId | undefined
}

interface ILedgerService {
  updateMetadataByHash(
    ledgerTxMetadata:
      | OnChainLedgerTransactionMetadataUpdate
      | LnLedgerTransactionMetadataUpdate,
  ): Promise<true | LedgerServiceError>

  getTransactionById(
    id: LedgerTransactionId,
  ): Promise<LedgerTransaction<WalletCurrency> | LedgerServiceError>

  getTransactionForWalletById(args: {
    walletId: WalletId
    transactionId: LedgerTransactionId
  }): Promise<LedgerTransaction<WalletCurrency> | LedgerServiceError>

  getTransactionForWalletByJournalId(args: {
    walletId: WalletId
    journalId: LedgerJournalId
  }): Promise<LedgerTransaction<WalletCurrency> | LedgerServiceError>

  getTransactionsByHash(
    paymentHash: PaymentHash | OnChainTxHash,
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerServiceError>

  getTransactionsForWalletByPaymentHash(args: {
    walletId: WalletId
    paymentHash: PaymentHash
  }): Promise<LedgerTransaction<WalletCurrency>[] | LedgerServiceError>

  getTransactionsByWalletIdsAndAddresses(args: {
    walletIds: WalletId[]
    addresses: OnChainAddress[]
    paginationArgs: PaginatedQueryArgs
  }): Promise<
    PaginatedQueryResult<LedgerTransaction<WalletCurrency>> | LedgerServiceError
  >

  getTransactionsByWalletId(
    walletId: WalletId,
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerServiceError>

  getTransactionsByWalletIds(args: {
    walletIds: WalletId[]
    paginationArgs: PaginatedQueryArgs
  }): Promise<
    PaginatedQueryResult<LedgerTransaction<WalletCurrency>> | LedgerServiceError
  >

  getTransactionsByWalletIdAndContactUsername(args: {
    walletIds: WalletId[]
    contactUsername: Username
    paginationArgs: PaginatedQueryArgs
  }): Promise<
    PaginatedQueryResult<LedgerTransaction<WalletCurrency>> | LedgerServiceError
  >

  listPendingPayments(
    walletId: WalletId,
  ): Promise<LedgerTransaction<WalletCurrency>[] | LedgerServiceError>

  listAllPaymentHashes(): AsyncGenerator<PaymentHash | LedgerError>

  getPendingPaymentsCount(walletId: WalletId): Promise<number | LedgerServiceError>

  getWalletBalance(walletId: WalletId): Promise<CurrencyBaseAmount | LedgerServiceError>

  getWalletBalanceAmount<S extends WalletCurrency>(
    walletDescriptor: WalletDescriptor<S>,
  ): Promise<BalanceAmount<S> | LedgerServiceError>

  isOnChainReceiptTxRecordedForWallet({
    walletId,
    txHash,
    vout,
  }: {
    walletId: WalletId
    txHash: OnChainTxHash
    vout: OnChainTxVout
  }): Promise<IsOnChainReceiptTxRecordedForWalletResult | LedgerServiceError>

  isOnChainTxHashRecorded(txHash: OnChainTxHash): Promise<boolean | LedgerServiceError>

  isToHotWalletTxRecorded(txHash: OnChainTxHash): Promise<boolean | LedgerServiceError>

  isLnTxRecorded(paymentHash: PaymentHash): Promise<boolean | LedgerServiceError>

  revertLightningPayment(
    args: RevertLightningPaymentArgs,
  ): Promise<true | LedgerServiceError>

  revertOnChainPayment(args: RevertOnChainPaymentArgs): Promise<true | LedgerServiceError>

  getWalletIdByPaymentHash(hash: PaymentHash): Promise<WalletId | LedgerServiceError>

  listWalletIdsWithPendingPayments: () => AsyncGenerator<WalletId> | LedgerServiceError

  addColdStorageTxReceive<T extends DisplayCurrency>(
    args: AddColdStorageTxReceiveArgs<T>,
  ): Promise<LedgerJournal | LedgerServiceError>

  addColdStorageTxSend<T extends DisplayCurrency>(
    args: AddColdStorageTxSendArgs<T>,
  ): Promise<LedgerJournal | LedgerServiceError>
}

type ActivityCheckerConfig = {
  monthlyVolumeThreshold: UsdCents
  priceRatio: WalletPriceRatio
  getVolumeAmountFn: NewGetVolumeAmountSinceFn
}

type ActivityChecker = {
  aboveThreshold: (wallets: Wallet[]) => Promise<boolean | LedgerServiceError>
}

type ImbalanceCalculatorConfig = {
  netInVolumeAmountLightningFn: NewGetVolumeAmountSinceFn
  netInVolumeAmountOnChainFn: NewGetVolumeAmountSinceFn
  sinceDaysAgo: Days
  method: WithdrawalFeePriceMethod
}

type ImbalanceCalculator = {
  getSwapOutImbalanceAmount: <T extends WalletCurrency>(
    wallet: WalletDescriptor<T>,
  ) => Promise<PaymentAmount<T> | LedgerServiceError | ValidationError>
}

type LnPaymentState =
  (typeof import("./ln-payment-state").LnPaymentState)[keyof typeof import("./ln-payment-state").LnPaymentState]

type LnPaymentStateDeterminator = {
  determine: () => LnPaymentState | InvalidLnPaymentTxnsBundleError
}
