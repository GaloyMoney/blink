type PaymentInitiationMethod =
  typeof import("./tx-methods").PaymentInitiationMethod[keyof typeof import("./tx-methods").PaymentInitiationMethod]
type SettlementMethod =
  typeof import("./tx-methods").SettlementMethod[keyof typeof import("./tx-methods").SettlementMethod]
type TxStatus =
  typeof import("./tx-status").TxStatus[keyof typeof import("./tx-status").TxStatus]
type WalletType =
  typeof import("./primitives").WalletType[keyof typeof import("./primitives").WalletType]

type InitiationViaIntraledger = {
  readonly type: "intraledger"
  readonly counterPartyWalletId: WalletId
  readonly counterPartyUsername: Username
}

type InitiationViaLn = {
  readonly type: "lightning"
  readonly paymentHash: PaymentHash
  readonly pubkey: Pubkey
}

type InitiationViaOnChain = {
  readonly type: "onchain"
  readonly address: OnChainAddress
}

// FIXME: create a migration to add OnChainAddress associated with old transaction to remove this legacy type
type InitiationViaOnChainLegacy = {
  readonly type: "onchain"
  readonly address?: OnChainAddress
}

type SettlementViaIntraledger = {
  readonly type: "intraledger"
  readonly counterPartyWalletId: WalletId
  readonly counterPartyUsername: Username | null
}

type SettlementViaLn = {
  readonly type: "lightning"
  readonly revealedPreImage: undefined // is added by dataloader in resolver
}

type SettlementViaOnChain = {
  readonly type: "onchain"
  transactionHash: OnChainTxHash
}

type BaseWalletTransaction<T extends DisplayCurrency> = {
  readonly id: LedgerTransactionId | OnChainTxHash
  readonly walletId: WalletId | undefined
  readonly settlementAmount: Satoshis | UsdCents
  readonly settlementFee: Satoshis | UsdCents
  readonly settlementCurrency: WalletCurrency
  readonly settlementDisplayAmount: DisplayCurrencyMajorAmount
  readonly settlementDisplayFee: DisplayCurrencyMajorAmount
  readonly settlementDisplayCurrency: T
  readonly displayCurrencyPerSettlementCurrencyUnit: number
  readonly status: TxStatus
  readonly memo: string | null
  readonly createdAt: Date
}

type IntraLedgerTransaction<T extends DisplayCurrency> = BaseWalletTransaction<T> & {
  readonly initiationVia: InitiationViaIntraledger
  readonly settlementVia: SettlementViaIntraledger
}

type WalletOnChainIntraledgerTransaction<T extends DisplayCurrency> =
  BaseWalletTransaction<T> & {
    readonly initiationVia: InitiationViaOnChain
    readonly settlementVia: SettlementViaIntraledger
  }

type WalletOnChainSettledTransaction<T extends DisplayCurrency> =
  BaseWalletTransaction<T> & {
    readonly initiationVia: InitiationViaOnChain
    readonly settlementVia: SettlementViaOnChain
  }

type WalletLegacyOnChainIntraledgerTransaction<T extends DisplayCurrency> =
  BaseWalletTransaction<T> & {
    readonly initiationVia: InitiationViaOnChainLegacy
    readonly settlementVia: SettlementViaIntraledger
  }

type WalletLegacyOnChainSettledTransaction<T extends DisplayCurrency> =
  BaseWalletTransaction<T> & {
    readonly initiationVia: InitiationViaOnChainLegacy
    readonly settlementVia: SettlementViaOnChain
  }

type WalletLnIntraledgerTransaction<T extends DisplayCurrency> =
  BaseWalletTransaction<T> & {
    readonly initiationVia: InitiationViaLn
    readonly settlementVia: SettlementViaIntraledger
  }

type WalletLnSettledTransaction<T extends DisplayCurrency> = BaseWalletTransaction<T> & {
  readonly initiationVia: InitiationViaLn
  readonly settlementVia: SettlementViaLn
}

type WalletOnChainTransaction<T extends DisplayCurrency> =
  | WalletOnChainIntraledgerTransaction<T>
  | WalletOnChainSettledTransaction<T>
  | WalletLegacyOnChainIntraledgerTransaction<T>
  | WalletLegacyOnChainSettledTransaction<T>

type WalletLnTransaction<T extends DisplayCurrency> =
  | WalletLnIntraledgerTransaction<T>
  | WalletLnSettledTransaction<T>

type WalletTransaction<T extends DisplayCurrency> =
  | IntraLedgerTransaction<T>
  | WalletOnChainTransaction<T>
  | WalletLnTransaction<T>

type WalletDetailsByWalletId<T extends DisplayCurrency> = Record<
  WalletId,
  {
    walletCurrency: WalletCurrency
    // TODO: Add conditional type here to be: S extends "BTC" ? undefined : WalletPriceRatio
    walletPriceRatio: WalletPriceRatio | undefined
    depositFeeRatio: DepositFeeRatio
    displayCurrency: T
    displayPriceRatio: DisplayPriceRatio<"BTC", T> | undefined
  }
>

type AddPendingIncomingArgs = {
  pendingIncoming: IncomingOnChainTransaction[]
  addressesByWalletId: { [key: WalletId]: OnChainAddress[] }
  walletDetailsByWalletId: WalletDetailsByWalletId<DisplayCurrency>
}

type ConfirmedTransactionHistory = {
  readonly transactions: WalletTransaction<DisplayCurrency>[]
  addPendingIncoming(args: AddPendingIncomingArgs): WalletTransactionHistoryWithPending
}

type WalletTransactionHistoryWithPending = {
  readonly transactions: WalletTransaction<DisplayCurrency>[]
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
  listByWalletCurrency(
    walletCurrency: WalletCurrency,
  ): Promise<Wallet[] | RepositoryError>
}

type onChainDepositFeeArgs = {
  amount: Satoshis
  ratio: DepositFeeRatio
}

type DepositFeeCalculator = {
  onChainDepositFee({ amount, ratio }: onChainDepositFeeArgs): Satoshis
  lnDepositFee(): Satoshis
}

type OnchainWithdrawalConfig = {
  thresholdImbalance: BtcPaymentAmount
  feeRatioAsBasisPoints: bigint
}

type OnChainWithdrawalFeeArgs = {
  minerFee: BtcPaymentAmount
  minBankFee: BtcPaymentAmount
  imbalance: BtcPaymentAmount
  amount: BtcPaymentAmount
}

type WithdrawalFeePriceMethod =
  typeof import("./index").WithdrawalFeePriceMethod[keyof typeof import("./index").WithdrawalFeePriceMethod]

type OnChainFeeCalculator = {
  withdrawalFee(args: OnChainWithdrawalFeeArgs): {
    totalFee: BtcPaymentAmount
    bankFee: BtcPaymentAmount
  }
  intraLedgerFees(): PaymentAmountInAllCurrencies
}

type PaymentInputValidatorConfig = (
  walletId: WalletId,
) => Promise<Wallet | RepositoryError>

type ValidatePaymentInputArgs<T extends undefined | string> = {
  amount: number
  senderWalletId: string
  senderAccount: Account
  recipientWalletId?: T
}
type ValidatePaymentInputRetBase = {
  amount: CurrencyBaseAmount
  senderWallet: Wallet
}
type ValidatePaymentInputRet<T extends undefined | string> = T extends undefined
  ? ValidatePaymentInputRetBase
  : ValidatePaymentInputRetBase & { recipientWallet: Wallet }

type PaymentInputValidator = {
  validatePaymentInput: <T extends undefined | string>(
    args: ValidatePaymentInputArgs<T>,
  ) => Promise<ValidatePaymentInputRet<T> | ValidationError | RepositoryError>
}
