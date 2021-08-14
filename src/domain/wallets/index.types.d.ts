type SettlementMethod =
  typeof import("./index").SettlementMethod[keyof typeof import("./index").SettlementMethod]

type BaseWalletTransaction = {
  readonly id: LedgerTransactionId | TxId
  readonly settlementVia: SettlementMethod
  readonly settlementAmount: Satoshis
  readonly settlementFee: Satoshis
  readonly description: string
  readonly pendingConfirmation: boolean
  readonly createdAt: Date
}

type IntraLedgerTransaction = BaseWalletTransaction & {
  readonly settlementVia: "intraledger"
  readonly recipientId: Username | null
  readonly paymentHash: PaymentHash
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
