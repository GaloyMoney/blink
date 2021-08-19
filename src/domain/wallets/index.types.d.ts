type PaymentInitiationMethod =
  typeof import("./tx-methods").PaymentInitiationMethod[keyof typeof import("./tx-methods").PaymentInitiationMethod]
type SettlementMethod =
  typeof import("./tx-methods").SettlementMethod[keyof typeof import("./tx-methods").SettlementMethod]

// Fields only needed to support the old schema
type Deprecated = {
  readonly description: string
  readonly type: LedgerTransactionType
  readonly usd: number
  readonly feeUsd: number
}

type BaseWalletTransaction = {
  readonly id: LedgerTransactionId | TxId
  readonly initiationVia: PaymentInitiationMethod
  readonly settlementVia: SettlementMethod
  readonly settlementAmount: Satoshis
  readonly settlementFee: Satoshis
  readonly pendingConfirmation: boolean
  readonly createdAt: Date

  readonly deprecated: Deprecated
}

type UsernameTransaction = BaseWalletTransaction & {
  readonly initiationVia: "username"
  readonly settlementVia: "intraledger"
  readonly recipientId: Username
}

type WalletOnChainTransaction = BaseWalletTransaction & {
  readonly initiationVia: "onchain"
  readonly settlementVia: "onchain" | "intraledger"
  readonly recipientId: Username | null
  readonly addresses: OnChainAddress[]
}

type WalletLnTransaction = BaseWalletTransaction & {
  readonly initiationVia: "lightning"
  readonly settlementVia: "lightning" | "intraledger"
  readonly recipientId: Username | null
  readonly paymentHash: PaymentHash
}

type WalletTransaction =
  | UsernameTransaction
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

declare const depositFeeRatioSymbol: unique symbol
type DepositFeeRatio = number & { [depositFeeRatioSymbol]: never }

type Wallet = {
  readonly id: WalletId
  readonly depositFeeRatio: DepositFeeRatio
  readonly onChainAddressIdentifiers: OnChainAddressIdentifier[]
  onChainAddresses(): OnChainAddress[]
}

interface IWalletsRepository {
  findById(walletId: WalletId): Promise<Wallet | RepositoryError>
}
