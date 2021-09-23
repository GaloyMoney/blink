type TxMetadata = {
  type: LedgerTransactionType
  pending: boolean
  fee: Satoshis
  feeUsd: number
  sats: Satoshis
  usd: number
  currency: Currency
}

type ReceiveLnTxMetadata = TxMetadata & {
  hash: PaymentHash
}

type SendLnTxMetadata = TxMetadata & {
  hash: PaymentHash
  pubkey: Pubkey
  feeKnownInAdvance: boolean
}

type SendLnIntraledgerTxMetadata = TxMetadata & {
  hash: PaymentHash
  pubkey: Pubkey
  memoPayer: string | null
  username: WalletName | null
}

type SendOnChainIntraledgerTxMetadata = TxMetadata & {
  payee_addresses: OnChainAddress[]
  sendAll: boolean
  memoPayer: string | null
  username: WalletName | null
}

type SendIntraledgerTxArgs = IntraledgerTxArgs & {
  metadata: SendLnIntraledgerTxMetadata | SendOnChainIntraledgerTxMetadata
}
