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
  // OP_RETURN utxos don't have valid addresses associated with them
  address: OnChainAddress | null
}

type OnChainTransaction = {
  id: TxId
  outs: TxOut[]
}

type SubmittedTransaction = {
  confirmations: number
  rawTx: OnChainTransaction
  fee: Satoshis
  createdAt: Date
  uniqueAddresses: () => OnChainAddress[]
}

type TxDecoder = {
  decode(txHex: string): OnChainTransaction
}

type TxFilterArgs = {
  confirmationsLessThan?: number
  confirmationsGreaterThanOrEqual?: number
  addresses?: OnChainAddress[]
}

type TxFilter = {
  apply(txsonChainTransactions: SubmittedTransaction[]): SubmittedTransaction[]
}

interface IOnChainService {
  getIncomingTransactions(
    scanDepth: number,
  ): Promise<SubmittedTransaction[] | OnChainServiceError>

  createOnChainAddress(): Promise<OnChainAddressIdentifier | OnChainServiceError>

  getOnChainFeeEstimate(
    amount: Satoshis,
    address: OnChainAddress,
  ): Promise<Satoshis | OnChainServiceError>
}
