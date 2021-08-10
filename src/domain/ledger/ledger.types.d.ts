declare const liabilitiesAccountId: unique symbol
type LiabilitiesAccountId = string & { [liabilitiesAccountId]: never }

declare const ledgerTransactionIdSymbol: unique symbol
type LedgerTransactionId = string & { [ledgerTransactionIdSymbol]: never }

declare const ledgerAccountIdSymbol: unique symbol
type LedgerAccountId = string & { [ledgerAccountIdSymbol]: never }

type LedgerTransactionType =
  typeof import("./index").LedgerTransactionType[keyof typeof import("./index").LedgerTransactionType]

type LedgerTransaction = {
  id: LedgerTransactionId
  type: LedgerTransactionType
  debit: Satoshis
  credit: Satoshis
  currency: TxDenominationCurrency
  timestamp: Date
  pending?: boolean
  username?: Username
  hash?: PaymentHash
  lnMemo?: string
  memoFromPayer?: string
  addresses?: OnChainAddress[]
}

interface ILedger {
  liabilityTransactions: (
    liabilitiesAccountId: LiabilitiesAccountId,
  ) => Promise<LedgerTransaction[] | LedgerError>
}
