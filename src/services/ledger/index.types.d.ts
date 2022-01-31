type TxMetadata = {
  type: LedgerTransactionType
  pending: boolean
  usd: DisplayCurrencyBaseAmount // to be renamed amountDisplayCurrency
}

type NonIntraledgerTxMetadata = TxMetadata & {
  currency: WalletCurrency
  fee: Satoshis
  feeUsd: DisplayCurrencyBaseAmount // to be renamed feeDisplayCurrency
}

type AddLnTxReceiveMetadata = NonIntraledgerTxMetadata & {
  hash: PaymentHash
}

type AddLnTxSendMetadata = NonIntraledgerTxMetadata & {
  hash: PaymentHash
  pubkey: Pubkey
  feeKnownInAdvance: boolean
}

type AddOnchainTxSendMetadata = NonIntraledgerTxMetadata & {
  hash: OnChainTxHash
  payee_addresses: OnChainAddress[]
  sendAll: boolean
}

type AddColdStorageTxReceiveMetadata = NonIntraledgerTxMetadata & {
  hash: OnChainTxHash
  payee_addresses: OnChainAddress[]
}

type AddColdStorageTxSendMetadata = NonIntraledgerTxMetadata & {
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

type AddWalletIdIntraledgerTxSendMetadata = IntraledgerTxMetadata

type SendIntraledgerTxArgs = IntraledgerTxArgs & {
  recipientUsername: Username | null
  shareMemoWithPayee: boolean
  metadata:
    | AddLnIntraledgerTxSendMetadata
    | AddOnChainIntraledgerTxSendMetadata
    | AddWalletIdIntraledgerTxSendMetadata
}

type LoadLedgerParams = {
  bankOwnerWalletResolver: () => Promise<WalletId>
  dealerWalletResolver: () => Promise<WalletId>
  funderWalletResolver: () => Promise<WalletId>
}
