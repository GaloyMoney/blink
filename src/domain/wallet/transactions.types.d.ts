type SettlementMethod = typeof import("./index").SettlementMethod[keyof typeof import("./index").SettlementMethod]

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

type OnChainTransaction = BaseWalletTransaction & {
  readonly settlementVia: "onchain"
  readonly addresses: OnchainAddress[]
}

type LnTransaction = BaseWalletTransaction & {
  readonly settlementVia: "lightning"
  readonly paymentHash: PaymentHash
}

type WalletTransaction = IntraLedgerTransaction | OnChainTransaction | LnTransaction
