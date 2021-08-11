declare const satoshisSymbol: unique symbol
type Satoshis = number & { [satoshisSymbol]: never }

declare const onChainAddressSymbol: unique symbol
type OnChainAddress = string & { [onChainAddressSymbol]: never }

declare const blockIdSymbol: unique symbol
type BlockId = string & { [blockIdSymbol]: never }

declare const txIdSymbol: unique symbol
type TxId = string & { [txIdSymbol]: never }

declare const btcNetworkSymbol: unique symbol
type BtcNetwork = string & { [btcNetworkSymbol]: never }

type TxOut = {
  sats: Satoshis
  n: number
  address: OnChainAddress
}

type OnChainTransaction = {
  id: TxId
  outs: TxOut[]
}

type SubmittedTransaction = {
  // blockId: BlockId
  confirmations: number
  fee: Satoshis
  id: TxId
  outputAddresses: OnChainAddress[]
  // satsToAddress(recipient: OnChainAddress): Satoshis
  tokens: Satoshis
  rawTx: OnChainTransaction
  createdAt: Date
}
