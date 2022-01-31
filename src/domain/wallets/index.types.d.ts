type PaymentInitiationMethod = typeof import("./tx-methods").PaymentInitiationMethod
type SettlementMethod = typeof import("./tx-methods").SettlementMethod
type TxStatus =
  typeof import("./tx-status").TxStatus[keyof typeof import("./tx-status").TxStatus]
type WalletType =
  typeof import("./primitives").WalletType[keyof typeof import("./primitives").WalletType]

type WalletCurrency =
  typeof import("./primitives").WalletCurrency[keyof typeof import("./primitives").WalletCurrency]

type Deprecated = {
  readonly description: string
  readonly type: LedgerTransactionType
  readonly usd: number
  readonly feeUsd: number
}

type InitiationViaIntraledger = {
  readonly type: PaymentInitiationMethod["IntraLedger"]
  readonly counterPartyWalletId: WalletId
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
  readonly counterPartyWalletId: WalletId
  readonly counterPartyUsername: Username | null
}

type SettlementViaLn = {
  readonly type: SettlementMethod["Lightning"]
  revealedPreImage: RevealedPreImage | null
}

type SettlementViaOnChain = {
  readonly type: SettlementMethod["OnChain"]
  transactionHash: OnChainTxHash
}

type BaseWalletTransaction = {
  readonly id: LedgerTransactionId | OnChainTxHash
  readonly walletId: WalletId | undefined
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

type NewWalletInfo = {
  readonly accountId: AccountId
  readonly type: WalletType
  readonly currency: WalletCurrency
}

type Wallet = NewWalletInfo & {
  readonly id: WalletId
  readonly onChainAddressIdentifiers: OnChainAddressIdentifier[]
  onChainAddresses(): OnChainAddress[]
}

interface IWalletsRepository {
  persistNew({
    accountId,
    type,
    currency,
  }: NewWalletInfo): Promise<Wallet | RepositoryError>
  findById(walletId: WalletId): Promise<Wallet | RepositoryError>

  listByAccountId(accountId: AccountId): Promise<Wallet[] | RepositoryError>

  findByAddress(address: OnChainAddress): Promise<Wallet | RepositoryError>
  listByAddresses(addresses: OnChainAddress[]): Promise<Wallet[] | RepositoryError>
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
  minerFee: Satoshis
  bankFee: Satoshis
}

type WithdrawalFeeCalculator = {
  onChainWithdrawalFee({ minerFee, bankFee }: OnChainWithdrawalFeeArgs): Satoshis
  onChainIntraLedgerFee(): Satoshis
}

type PaymentInputValidatorConfig = (
  walletId: WalletId,
) => Promise<Wallet | RepositoryError>

type ValidatePaymentInputSenderArgs = {
  amount: number
  senderWalletId: string
  senderAccount: Account
}

type ValidatePaymentInputRet = {
  amount: Satoshis
  senderWallet: Wallet
}

type ValidatePaymentInputRecipientArgs = {
  recipientWalletId: string
  senderWallet: Wallet
}
type ValidatePaymentInputRecipientRet = {
  recipientWallet: Wallet
}

type PaymentInputValidator = {
  validateSender: (
    args: ValidatePaymentInputSenderArgs,
  ) => Promise<ValidatePaymentInputRet | ValidationError | RepositoryError>
  validateRecipient: (
    args: ValidatePaymentInputRecipientArgs,
  ) => Promise<ValidatePaymentInputRecipientRet | ValidationError | RepositoryError>
}
