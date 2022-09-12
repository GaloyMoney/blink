interface ILedgerTransaction {
  _id?: ObjectId
  credit: number
  debit: number
  meta?: { [k: string]: unknown }
  datetime: Date
  account_path: string[]
  accounts: string
  book: string
  memo: string
  _journal: ObjectId
  timestamp: Date
  voided?: boolean
  void_reason?: string
  _original_journal?: ObjectId

  hash?: string
  txid?: string
  type: LedgerTransactionType
  pending: boolean
  err?: string
  currency: WalletCurrency
  fee: number
  feeKnownInAdvance?: boolean
  related_journal?: ObjectId
  payee_addresses?: string[]
  memoPayer?: string
  usd?: number
  sats?: number
  feeUsd?: number
  username?: string
  pubkey?: string

  satsAmount: number
  centsAmount: number
  satsFee: number
  centsFee: number
  displayAmount: number
  displayFee: number
  displayCurrency: string
}

interface TransactionMetadataRecord {
  _id: ObjectId

  hash?: string
  revealedPreImage?: string
  swap: SwapTransactionMetadataUpdate
}
