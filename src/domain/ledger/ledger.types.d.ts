declare const ledgerTransactionIdSymbol: unique symbol
type LedgerTransactionId = string & { [ledgerTransactionIdSymbol]: never }

declare const ledgerAccountIdSymbol: unique symbol
type LedgerAccountId = string & { [ledgerAccountIdSymbol]: never }

type LedgerTransactionType = typeof import("./transaction").LedgerTransactionType[keyof typeof import("./transaction").LedgerTransactionType]

type LedgerTransaction = {
  id: LedgerTransactionId
  debit: Satoshis
  credit: Satoshis
  currency: TxDenominationCurrency
}

interface ILedger {
  transactionsForWallet: () => void
}
