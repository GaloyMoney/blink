type TxDecoder = {
  decode(txHex: string): OnChainTransaction | TransactionDecodeError
}
