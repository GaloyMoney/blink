type OnChainError = import("./errors").OnChainError
type TransactionDecodeError = import("./errors").TransactionDecodeError
type OnChainServiceError = import("./errors").OnChainServiceError

type OnChainAddress = string & { readonly brand: unique symbol }
type BlockId = string & { readonly brand: unique symbol }
type OnChainTxHash = string & { readonly brand: unique symbol }
type ScanDepth = number & { readonly brand: unique symbol }
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

type IncomingOnChainTransactionFromCache = {
  confirmations: number
  rawTx: OnChainTransaction
  fee: Satoshis
  createdAt: string
}

type OutgoingOnChainTransaction = {
  confirmations: number
  rawTx: OnChainTransaction
  fee: Satoshis
  description: string
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

type ListTransactionsArgs = {
  scanDepth: ScanDepth
}
type ListIncomingTransactionsArgs = ListTransactionsArgs
type ListOutgoingTransactionsArgs = ListTransactionsArgs

type LookupOnChainFeeArgs = {
  txHash: OnChainTxHash
  scanDepth: ScanDepth
}

type GetOnChainFeeEstimateArgs = {
  amount: Satoshis
  address: OnChainAddress
  targetConfirmations: TargetConfirmations
}

type PayToAddressArgs = {
  amount: Satoshis
  address: OnChainAddress
  targetConfirmations: TargetConfirmations
  description?: string
}

type IncomingOnChainTxHandler = {
  balancesByAddresses(): { [key: OnChainAddress]: BtcPaymentAmount } | ValidationError
  balanceByWallet(
    wallets: Wallet[],
  ): { [key: WalletId]: BtcPaymentAmount } | ValidationError
}

type LookupOnChainPaymentArgs = {
  txHash: OnChainTxHash
  scanDepth: ScanDepth
}

type LookupOnChainReceiptArgs = LookupOnChainPaymentArgs

interface IOnChainService {
  listActivePubkeys(): Pubkey[]

  getBalance(pubkey?: Pubkey): Promise<Satoshis | OnChainServiceError>

  getPendingBalance(pubkey?: Pubkey): Promise<Satoshis | OnChainServiceError>

  listIncomingTransactions({
    scanDepth,
  }: ListIncomingTransactionsArgs): Promise<
    IncomingOnChainTransaction[] | OnChainServiceError
  >

  listOutgoingTransactions({
    scanDepth,
  }: ListOutgoingTransactionsArgs): Promise<
    OutgoingOnChainTransaction[] | OnChainServiceError
  >

  lookupOnChainFee({
    txHash,
    scanDepth,
  }: LookupOnChainFeeArgs): Promise<Satoshis | OnChainServiceError>

  lookupOnChainPayment({
    txHash,
    scanDepth,
  }: LookupOnChainPaymentArgs): Promise<OutgoingOnChainTransaction | OnChainServiceError>

  lookupOnChainReceipt({
    txHash,
    scanDepth,
  }: LookupOnChainReceiptArgs): Promise<IncomingOnChainTransaction | OnChainServiceError>

  createOnChainAddress(): Promise<OnChainAddressIdentifier | OnChainServiceError>

  getOnChainFeeEstimate({
    amount,
    address,
    targetConfirmations,
  }: GetOnChainFeeEstimateArgs): Promise<Satoshis | OnChainServiceError>

  payToAddress({
    amount,
    address,
    targetConfirmations,
  }: PayToAddressArgs): Promise<OnChainTxHash | OnChainServiceError>
}
