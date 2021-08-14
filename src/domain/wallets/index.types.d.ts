type SettlementMethod =
  typeof import("./settlement-method").SettlementMethod[keyof typeof import("./settlement-method").SettlementMethod]

// Fields only needed to support the old schema
type UsdPerSat = number
type OldTxFields = {
  readonly description: string
  readonly type: LedgerTransactionType
  readonly usd: number
  readonly feeUsd: number
}

type BaseWalletTransaction = {
  readonly id: LedgerTransactionId | TxId
  readonly settlementVia: SettlementMethod
  readonly settlementAmount: Satoshis
  readonly settlementFee: Satoshis
  readonly pendingConfirmation: boolean
  readonly createdAt: Date

  readonly old: OldTxFields
}

type IntraLedgerTransaction = BaseWalletTransaction & {
  readonly settlementVia: "intraledger"
  readonly recipientId: Username | null
  readonly paymentHash: PaymentHash | null
  readonly addresses: OnChainAddress[] | null
}

type WalletOnChainTransaction = BaseWalletTransaction & {
  readonly settlementVia: "onchain"
  readonly addresses: OnChainAddress[]
}

type WalletLnTransaction = BaseWalletTransaction & {
  readonly settlementVia: "lightning"
  readonly paymentHash: PaymentHash
}

type WalletTransaction =
  | IntraLedgerTransaction
  | WalletOnChainTransaction
  | WalletLnTransaction

type ConfirmedTransactionHistory = {
  readonly transactions: WalletTransaction[]
  addPendingIncoming(
    pendingIncoming: SubmittedTransaction[],
    addresses: OnChainAddress[],
    usdPerSat: UsdPerSat,
  ): WalletTransactionHistoryWithPending
}

type WalletTransactionHistoryWithPending = {
  readonly transactions: WalletTransaction[]
}

type OnChainAddressIdentifier = {
  readonly pubkey: Pubkey
  readonly address: OnChainAddress
}

type Wallet = {
  readonly id: WalletId
  readonly onChainAddressIdentifiers: OnChainAddressIdentifier[]
  readonly onChainAddresses: OnChainAddress[]
}

interface IWalletsRepository {
  findById(walletId: WalletId): Promise<Wallet | RepositoryError>
}
