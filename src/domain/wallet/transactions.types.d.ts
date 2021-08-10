type BaseWalletTransaction = {
  readonly id: LedgerTransactionId
  readonly description: string
  readonly type: LedgerTransactionType
  readonly created_at: string
}

type IntraLedgerTransaction = BaseWalletTransaction & {
  // readonly recipientId: Username
  readonly username: Username
}

type OnChainTransaction = BaseWalletTransaction & {
  readonly pending: boolean
  readonly addresses: OnChainAddress[]
}

type LnTransaction = BaseWalletTransaction & {
  readonly pending: boolean
  // readonly paymentHash: PaymentHash
  readonly hash: PaymentHash
}

type WalletTransaction = IntraLedgerTransaction | OnChainTransaction | LnTransaction
