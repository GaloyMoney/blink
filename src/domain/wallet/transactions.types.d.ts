type SettlementMethod =
  typeof import("./index").SettlementMethod[keyof typeof import("./index").SettlementMethod]

type BaseWalletTransaction = {
  readonly id: LedgerTransactionId
  readonly settlementVia: SettlementMethod
  readonly settlementAmount: Satoshis
  readonly settlementFee: Satoshis
  readonly description: string
  readonly pendingConfirmation: boolean
  readonly createdAt: Date
}

type IntraLedgerTransaction = BaseWalletTransaction & {
  readonly settlementVia: "intraledger"
  readonly recipientId: Username
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
