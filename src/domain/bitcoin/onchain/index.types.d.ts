type OnChainError = import("./errors").OnChainError
type TransactionDecodeError = import("./errors").TransactionDecodeError
type OnChainServiceError = import("./errors").OnChainServiceError

declare const onChainAddressSymbol: unique symbol
type OnChainAddress = string & { [onChainAddressSymbol]: never }

declare const blockIdSymbol: unique symbol
type BlockId = string & { [blockIdSymbol]: never }

declare const txIdSymbol: unique symbol
type TxId = string & { [txIdSymbol]: never }

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
  confirmations: number
  fee: Satoshis
  id: TxId
  outputAddresses: OnChainAddress[]
  tokens: Satoshis
  rawTx: OnChainTransaction
  createdAt: Date
}

type TxDecoder = {
  decode(txHex: string): OnChainTransaction | TransactionDecodeError
}

type TxFilterArgs = {
  confsLT?: number
  confsGTE?: number
  addresses?: OnChainAddress[]
}

type TxFilter = {
  apply(txsonChainTransactions: SubmittedTransaction[]): SubmittedTransaction[]
}

interface IOnChainService {
  getIncomingTransactions({
    scanDepth: number,
  }): Promise<SubmittedTransaction[] | OnChainServiceError>
}
