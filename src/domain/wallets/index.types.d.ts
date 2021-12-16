type PaymentInitiationMethod = typeof import("./tx-methods").PaymentInitiationMethod
type SettlementMethod = typeof import("./tx-methods").SettlementMethod
type TxStatus =
  typeof import("./tx-status").TxStatus[keyof typeof import("./tx-status").TxStatus]

type Deprecated = {
  readonly description: string
  readonly type: LedgerTransactionType
  readonly usd: number
  readonly feeUsd: number
}

type InitiationViaIntraledger = {
  readonly type: PaymentInitiationMethod["IntraLedger"]
  readonly counterPartyWalletPublicId: WalletPublicId
  readonly counterPartyUsername: Username
}

type InitiationViaLn = {
  readonly type: PaymentInitiationMethod["Lightning"]
  readonly paymentHash: PaymentHash
  readonly pubkey: Pubkey
}

type InitiationViaOnChain = {
  readonly type: PaymentInitiationMethod["OnChain"]
  readonly address: OnChainAddress
}

// FIXME: create a migration to add OnChainAddress associated with old transaction to remove this legacy type
type InitiationViaOnChainLegacy = {
  readonly type: PaymentInitiationMethod["OnChain"]
  readonly address?: OnChainAddress
}

type SettlementViaIntraledger = {
  readonly type: SettlementMethod["IntraLedger"]
  readonly counterPartyWalletPublicId: WalletPublicId
  readonly counterPartyUsername: Username | null
}

type SettlementViaLn = {
  readonly type: SettlementMethod["Lightning"]
  paymentSecret: PaymentSecret | null
}

type SettlementViaOnChain = {
  readonly type: SettlementMethod["OnChain"]
  transactionHash: OnChainTxHash
}

type BaseWalletTransaction = {
  readonly id: LedgerTransactionId | OnChainTxHash
  readonly walletId: WalletId | null
  readonly settlementAmount: Satoshis
  readonly settlementFee: Satoshis
  readonly settlementUsdPerSat: number
  readonly status: TxStatus
  readonly memo: string | null
  readonly createdAt: Date

  readonly deprecated: Deprecated
}

type IntraLedgerTransaction = BaseWalletTransaction & {
  readonly initiationVia: InitiationViaIntraledger
  readonly settlementVia: SettlementViaIntraledger
}

type WalletOnChainIntraledgerTransaction = BaseWalletTransaction & {
  readonly initiationVia: InitiationViaOnChain
  readonly settlementVia: SettlementViaIntraledger
}

type WalletOnChainSettledTransaction = BaseWalletTransaction & {
  readonly initiationVia: InitiationViaOnChain
  readonly settlementVia: SettlementViaOnChain
}

type WalletLegacyOnChainIntraledgerTransaction = BaseWalletTransaction & {
  readonly initiationVia: InitiationViaOnChainLegacy
  readonly settlementVia: SettlementViaIntraledger
}

type WalletLegacyOnChainSettledTransaction = BaseWalletTransaction & {
  readonly initiationVia: InitiationViaOnChainLegacy
  readonly settlementVia: SettlementViaOnChain
}

type WalletLnIntraledgerTransaction = BaseWalletTransaction & {
  readonly initiationVia: InitiationViaLn
  readonly settlementVia: SettlementViaIntraledger
}

type WalletLnSettledTransaction = BaseWalletTransaction & {
  readonly initiationVia: InitiationViaLn
  readonly settlementVia: SettlementViaLn
}

type WalletOnChainTransaction =
  | WalletOnChainIntraledgerTransaction
  | WalletOnChainSettledTransaction
  | WalletLegacyOnChainIntraledgerTransaction
  | WalletLegacyOnChainSettledTransaction

type WalletLnTransaction = WalletLnIntraledgerTransaction | WalletLnSettledTransaction

type WalletTransaction =
  | IntraLedgerTransaction
  | WalletOnChainTransaction
  | WalletLnTransaction

type ConfirmedTransactionHistory = {
  readonly transactions: WalletTransaction[]
  addPendingIncoming(
    walletId: WalletId,
    pendingIncoming: IncomingOnChainTransaction[],
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
  readonly publicId: WalletPublicId
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
