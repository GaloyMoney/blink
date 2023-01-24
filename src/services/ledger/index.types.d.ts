type TxnGroup = keyof typeof import("./volume").TxnGroups
type TxnTypes = typeof import("./volume").TxnGroups[TxnGroup]

type RecordSendArgs = {
  description: string
  senderWalletDescriptor: WalletDescriptor<WalletCurrency>
  amountToDebitSender: {
    usd: UsdPaymentAmount
    btc: BtcPaymentAmount
  }
  metadata: SendLedgerMetadata
  bankFee?: {
    usd: UsdPaymentAmount
    btc: BtcPaymentAmount
  }
}

type RecordReceiveArgs = {
  description: string
  recipientWalletDescriptor: WalletDescriptor<WalletCurrency>
  amountToCreditReceiver: {
    usd: UsdPaymentAmount
    btc: BtcPaymentAmount
  }
  metadata: ReceiveLedgerMetadata
  txMetadata?: LnLedgerTransactionMetadataUpdate
  bankFee?: {
    usd: UsdPaymentAmount
    btc: BtcPaymentAmount
  }
}

type RecordIntraledgerArgs = {
  description: string
  senderWalletDescriptor: WalletDescriptor<WalletCurrency>
  recipientWalletDescriptor: WalletDescriptor<WalletCurrency>
  amount: {
    usd: UsdPaymentAmount
    btc: BtcPaymentAmount
  }
  metadata: IntraledgerLedgerMetadata
  additionalDebitMetadata: TxMetadata
  additionalCreditMetadata: TxMetadata
}

type LedgerMetadata = {
  type: LedgerTransactionType
  pending: boolean
}

type NonIntraledgerLedgerMetadata = LedgerMetadata & {
  usd: number // to be removed when "centAmount" takes over
  fee: Satoshis
  feeUsd: number // to be removed when "centFee" takes over
}

type LnReceiveLedgerMetadata = NonIntraledgerLedgerMetadata &
  SendAmountsMetadata & {
    hash: PaymentHash
    pubkey: Pubkey
  }

type OnChainReceiveLedgerMetadata = NonIntraledgerLedgerMetadata &
  SendAmountsMetadata & {
    hash: OnChainTxHash
    payee_addresses: OnChainAddress[]
  }

type SendAmountsMetadata = {
  satsAmount: Satoshis
  centsAmount: UsdCents
  satsFee: Satoshis
  centsFee: UsdCents

  displayAmount: DisplayCurrencyBaseAmount
  displayFee: DisplayCurrencyBaseAmount
  displayCurrency: DisplayCurrency
}

type AddLnSendLedgerMetadata = NonIntraledgerLedgerMetadata &
  SendAmountsMetadata & {
    hash: PaymentHash
    pubkey: Pubkey
    feeKnownInAdvance: boolean
  }

type AddOnchainSendLedgerMetadata = NonIntraledgerLedgerMetadata &
  SendAmountsMetadata & {
    hash: OnChainTxHash
    payee_addresses: OnChainAddress[]
    sendAll: boolean
  }

type AddColdStorageLedgerMetadata = NonIntraledgerLedgerMetadata & {
  hash: OnChainTxHash
  payee_addresses: OnChainAddress[]
  currency: WalletCurrency
}

type AddColdStorageReceiveLedgerMetadata = AddColdStorageLedgerMetadata

type AddColdStorageSendLedgerMetadata = AddColdStorageLedgerMetadata

type IntraledgerBaseMetadata = LedgerMetadata & {
  usd: DisplayCurrencyBaseAmount // to be renamed amountDisplayCurrency
  memoPayer?: string
  username?: Username
}

type AddLnIntraledgerSendLedgerMetadata = IntraledgerBaseMetadata &
  SendAmountsMetadata & {
    hash: PaymentHash
    pubkey: Pubkey
  }

type AddLnTradeIntraAccountLedgerMetadata = Omit<
  AddLnIntraledgerSendLedgerMetadata,
  "username"
>

type AddOnChainIntraledgerSendLedgerMetadata = IntraledgerBaseMetadata &
  SendAmountsMetadata & {
    payee_addresses: OnChainAddress[]
    sendAll: boolean
  }

type AddOnChainTradeIntraAccountLedgerMetadata = Omit<
  AddOnChainIntraledgerSendLedgerMetadata,
  "username"
>

type AddWalletIdIntraledgerSendLedgerMetadata = IntraledgerBaseMetadata &
  SendAmountsMetadata

type AddWalletIdTradeIntraAccountLedgerMetadata = Omit<
  AddWalletIdIntraledgerSendLedgerMetadata,
  "username"
>

type ReimbursementLedgerMetadata = SendAmountsMetadata & {
  hash: PaymentHash
  pending: boolean
  usd: DisplayCurrencyBaseAmount
  related_journal: LedgerJournalId
}

type FeeReimbursementLedgerMetadata = ReimbursementLedgerMetadata & {
  type: LedgerTransactionTypeObject["LnFeeReimbursement"]
}

type FailedPaymentLedgerMetadata = ReimbursementLedgerMetadata & {
  type: LedgerTransactionTypeObject["Payment"]
}

type LnRoutingRevenueLedgerMetadata = LedgerMetadata & {
  feesCollectedOn: string
}

type LnChannelOpenOrClosingFee = LedgerMetadata & {
  txid: OnChainTxHash
}

type LoadLedgerParams = {
  bankOwnerWalletResolver: () => Promise<WalletId>
  dealerBtcWalletResolver: () => Promise<WalletId>
  dealerUsdWalletResolver: () => Promise<WalletId>
  funderWalletResolver: () => Promise<WalletId>
}

type ReceiveLedgerMetadata =
  | FeeReimbursementLedgerMetadata
  | FailedPaymentLedgerMetadata
  | LnReceiveLedgerMetadata
  | OnChainReceiveLedgerMetadata

type IntraledgerLedgerMetadata =
  | AddOnChainIntraledgerSendLedgerMetadata
  | AddLnIntraledgerSendLedgerMetadata
  | AddWalletIdIntraledgerSendLedgerMetadata

type SendLedgerMetadata = AddOnchainSendLedgerMetadata | AddLnSendLedgerMetadata

type PaginatedArray<T> = { slice: T[]; total: number }

// The following is needed for src/services/ledger/paginated-ledger.ts
declare module "medici/build/helper/parse/parseFilterQuery"
