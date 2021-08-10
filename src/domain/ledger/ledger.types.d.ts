declare const liabilitiesAccountId: unique symbol
type LiabilitiesAccountId = string & { [liabilitiesAccountId]: never }

declare const ledgerTransactionIdSymbol: unique symbol
type LedgerTransactionId = string & { [ledgerTransactionIdSymbol]: never }

declare const ledgerAccountIdSymbol: unique symbol
type LedgerAccountId = string & { [ledgerAccountIdSymbol]: never }

type LedgerTransactionType = typeof import("./index").LedgerTransactionType[keyof typeof import("./index").LedgerTransactionType]

type LedgerTransaction = {
  readonly id: LedgerTransactionId
  readonly type: LedgerTransactionType
  readonly debit: Satoshis
  readonly credit: Satoshis
  readonly fee: Satoshis
  readonly currency: TxDenominationCurrency
  readonly timestamp: Date
  readonly pendingConfirmation: boolean

  readonly lnMemo?: string

  // for IntraLedger
  readonly username?: Username
  readonly memoFromPayer?: string

  // for ln
  readonly paymentHash?: PaymentHash

  // for onchain
  readonly addresses?: OnChainAddress[]
}

interface ILedger {
  liabilityTransactions: (
    liabilitiesAccountId: LiabilitiesAccountId,
  ) => Promise<LedgerTransaction[] | LedgerError>
}
