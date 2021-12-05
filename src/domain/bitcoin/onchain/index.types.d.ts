type OnChainError = import("./errors").OnChainError
type TransactionDecodeError = import("./errors").TransactionDecodeError
type OnChainServiceError = import("./errors").OnChainServiceError

declare const onChainAddressSymbol: unique symbol
type OnChainAddress = string & { [onChainAddressSymbol]: never }

declare const blockIdSymbol: unique symbol
type BlockId = string & { [blockIdSymbol]: never }

declare const onChainTxHashSymbol: unique symbol
type OnChainTxHash = string & { [onChainTxHashSymbol]: never }

type TxOut = {
  sats: Satoshis
  // OP_RETURN utxos don't have valid addresses associated with them
  address: OnChainAddress | null
}

type OnChainTransaction = {
  txHash: OnChainTxHash
  outs: TxOut[]
}

type IncomingOnChainTransaction = {
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
  apply(txs: IncomingOnChainTransaction[]): IncomingOnChainTransaction[]
}

type FindOnChainFeeArgs = {
  txHash: OnChainTxHash
  scanDepth: number
}

interface IOnChainService {
  listIncomingTransactions(
    scanDepth: number,
  ): Promise<IncomingOnChainTransaction[] | OnChainServiceError>

  findOnChainFee({
    txHash,
    scanDepth,
  }: FindOnChainFeeArgs): Promise<Satoshis | OnChainServiceError>

  createOnChainAddress(): Promise<OnChainAddressIdentifier | OnChainServiceError>

  getOnChainFeeEstimate(
    amount: Satoshis,
    address: OnChainAddress,
    targetConfirmations: TargetConfirmations,
  ): Promise<Satoshis | OnChainServiceError>
}
