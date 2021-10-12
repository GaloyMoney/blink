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
  payment: LnPaymentLookup | null
  feeKnownInAdvance: boolean
}

type IntraledgerTxMetadata = TxMetadata & {
  memoPayer: string | null
  username: Username | null
}

type AddLnIntraledgerTxSendMetadata = IntraledgerTxMetadata & {
  hash: PaymentHash
  pubkey: Pubkey
}

type AddOnChainIntraledgerTxSendMetadata = IntraledgerTxMetadata & {
  payee_addresses: OnChainAddress[]
  sendAll: boolean
}

type AddUsernameIntraledgerTxSendMetadata = IntraledgerTxMetadata

type SendIntraledgerTxArgs = IntraledgerTxArgs & {
  recipientUsername: Username | null
  shareMemoWithPayee: boolean
  metadata:
    | AddLnIntraledgerTxSendMetadata
    | AddOnChainIntraledgerTxSendMetadata
    | AddUsernameIntraledgerTxSendMetadata
}
