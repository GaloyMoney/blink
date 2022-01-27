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

type AddOnchainTxSendMetadata = TxMetadata & {
  hash: OnChainTxHash
  payee_addresses: OnChainAddress[]
  sendAll: boolean
}

type AddColdStorageTxReceiveMetadata = TxMetadata & {
  hash: OnChainTxHash
  payee_addresses: OnChainAddress[]
}

type AddColdStorageTxSendMetadata = TxMetadata & {
  hash: OnChainTxHash
  payee_addresses: OnChainAddress[]
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

type addWalletIdIntraledgerTxSendMetadata = IntraledgerTxMetadata

type SendIntraledgerTxArgs = IntraledgerTxArgs & {
  recipientUsername: Username | null
  shareMemoWithPayee: boolean
  metadata:
    | AddLnIntraledgerTxSendMetadata
    | AddOnChainIntraledgerTxSendMetadata
    | addWalletIdIntraledgerTxSendMetadata
}

type LoadLedgerParams = {
  bankOwnerWalletResolver: () => Promise<WalletId>
  dealerWalletResolver: () => Promise<WalletId>
  funderWalletResolver: () => Promise<WalletId>
}
