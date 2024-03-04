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
  vout?: number
  txid?: string
  type: LedgerTransactionType
  pending: boolean
  bundle_completion_state?: LnPaymentState
  err?: string
  currency: WalletCurrency
  feeKnownInAdvance?: boolean
  related_journal?: ObjectId | string
  payee_addresses?: string[]
  request_id?: string
  payout_id?: string
  memoPayer?: string
  sats?: number
  username?: string
  pubkey?: string

  satsAmount: number
  centsAmount: number
  satsFee: number
  centsFee: number
  displayAmount: number
  displayFee: number
  displayCurrency: string

  // FIXME: Admin-only, to be removed with satsAmount changes
  fee?: number
  usd?: number
  feeUsd?: number
}

interface TransactionMetadataRecord {
  _id: ObjectId

  hash?: string
  revealedPreImage?: string
}
