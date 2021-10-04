type PaymentInitiationMethod =
  typeof import("./tx-methods").PaymentInitiationMethod[keyof typeof import("./tx-methods").PaymentInitiationMethod]
type SettlementMethod =
  typeof import("./tx-methods").SettlementMethod[keyof typeof import("./tx-methods").SettlementMethod]
type TxStatus =
  typeof import("./tx-status").TxStatus[keyof typeof import("./tx-status").TxStatus]

type Deprecated = {
  readonly description: string
  readonly type: LedgerTransactionType
  readonly usd: number
  readonly feeUsd: number
}

type BaseWalletTransaction = {
  readonly id: LedgerTransactionId | TxId
  readonly walletId: WalletId | null
  readonly initiationVia: PaymentInitiationMethod
  readonly settlementVia: SettlementMethod
  readonly settlementAmount: Satoshis
  readonly settlementFee: Satoshis
  readonly status: TxStatus
  readonly memo: string | null
  readonly createdAt: Date

  readonly deprecated: Deprecated
}

type IntraLedgerTransaction = BaseWalletTransaction & {
  readonly initiationVia: "walletid"
  readonly settlementVia: "intraledger"
  readonly recipientUsername: Username
}

type WalletOnChainTransaction = BaseWalletTransaction & {
  readonly initiationVia: "onchain"
  readonly settlementVia: "onchain" | "intraledger"
  readonly recipientUsername: Username | null
  readonly addresses: OnChainAddress[]
}

type WalletLnTransaction = BaseWalletTransaction & {
  readonly initiationVia: "lightning"
  readonly settlementVia: "lightning" | "intraledger"
  readonly recipientUsername: Username | null
  readonly paymentHash: PaymentHash
  readonly pubkey: Pubkey
}

type WalletTransaction =
  | IntraLedgerTransaction
  | WalletOnChainTransaction
  | WalletLnTransaction

type ConfirmedTransactionHistory = {
  readonly transactions: WalletTransaction[]
  addPendingIncoming(
    walletId: WalletId,
    pendingIncoming: SubmittedTransaction[],
    addresses: OnChainAddress[],
    usdPerSat: UsdPerSat,
  ): WalletTransactionHistoryWithPending
}

type WalletTransactionHistoryWithPending = {
  readonly transactions: WalletTransaction[]
}

declare const depositFeeRatioSymbol: unique symbol
type DepositFeeRatio = number & { [depositFeeRatioSymbol]: never }

declare const withdrawFeeSymbol: unique symbol
type WithdrawFee = number & { [withdrawFeeSymbol]: never }

type Wallet = {
  readonly id: WalletId
  readonly publicId: WalletPublicId | null
  readonly depositFeeRatio: DepositFeeRatio
  readonly withdrawFee: WithdrawFee
  readonly onChainAddressIdentifiers: OnChainAddressIdentifier[]
  onChainAddresses(): OnChainAddress[]
}

interface IWalletsRepository {
  findById(walletId: WalletId): Promise<Wallet | RepositoryError>
  findByAddress(address: OnChainAddress): Promise<Wallet | RepositoryError>
  findByUsername(username: Username): Promise<Wallet | RepositoryError>
  findByPublicId(publicId: WalletPublicId): Promise<Wallet | RepositoryError>
  listByAddresses(addresses: string[]): Promise<Wallet[] | RepositoryError>
}

type onChainDepositFeeArgs = {
  amount: Satoshis
  ratio: DepositFeeRatio
}

type DepositFeeCalculator = {
  onChainDepositFee({ amount, ratio }: onChainDepositFeeArgs): Satoshis
  lnDepositFee(): Satoshis
}

type OnChainWithdrawalFeeArgs = {
  onChainFee: Satoshis
  walletFee: Satoshis
}

type WithdrawalFeeCalculator = {
  onChainWithdrawalFee({ onChainFee, walletFee }: OnChainWithdrawalFeeArgs): Satoshis
  onChainIntraLedgerFee(): Satoshis
}
