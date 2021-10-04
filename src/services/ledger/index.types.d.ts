type TxMetadata = {
  type: LedgerTransactionType
  pending: boolean
  fee: Satoshis
  feeUsd: number
  sats: Satoshis
  usd: number
  currency: Currency
}

type AddLnTxReceiveMetadata = TxMetadata & {
  hash: PaymentHash
}

type AddLnTxSendMetadata = TxMetadata & {
  hash: PaymentHash
  pubkey: Pubkey
  feeKnownInAdvance: boolean
}

type AddLnIntraledgerTxSendMetadata = TxMetadata & {
  hash: PaymentHash
  pubkey: Pubkey
  memoPayer: string | null
  username: Username | null
}

type AddOnChainIntraledgerTxSendMetadata = TxMetadata & {
  payee_addresses: OnChainAddress[]
  sendAll: boolean
  memoPayer: string | null
  username: Username | null
}

type SendIntraledgerTxArgs = IntraledgerTxArgs & {
  metadata: AddLnIntraledgerTxSendMetadata | AddOnChainIntraledgerTxSendMetadata
}
