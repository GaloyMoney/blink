type UnknownRepositoryError = import("@domain/errors").UnknownRepositoryError
type WalletAlreadyExistError = import("./errors").WalletAlreadyExistError

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

type OutgoingOnChainTransaction = {
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
}

// FIXME(nicolas): LndOnChainService and BitcoinOnchainService are not interchangeable and
// will probably never be.
// so the idea of a generic interface doesn't make a lot of sense in my mind
interface IOnChainService {
  getBalance(): Promise<Satoshis | OnChainServiceError>

  listIncomingTransactions(
    scanDepth: ScanDepth,
  ): Promise<IncomingOnChainTransaction[] | OnChainServiceError>

  lookupOnChainFee({
    txHash,
    scanDepth,
  }: LookupOnChainFeeArgs): Promise<Satoshis | OnChainServiceError>

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

interface IBitcoindService {
  getBlockCount(): Promise<number>
  getBlockchainInfo(): Promise<{ chain: BtcNetwork }>
  createWallet(
    walletName: BitcoindWalletName,
  ): Promise<
    | { name: BitcoindWalletName; warning: string }
    | UnknownRepositoryError
    | WalletAlreadyExistError
  >
  listWallets(): Promise<BitcoindWalletName[]>
  loadWallet(walletName: BitcoindWalletName): Promise<{ name: string; warning: string }>
  unloadWallet(walletName: BitcoindWalletName): Promise<{ warning: string }>
}

interface IBitcoindWalletService {
  getNewAddress(): Promise<OnChainAddress>
  getAddressInfo(address: OnChainAddress): Promise<GetAddressInfoResult>
  sendToAddress({
    address,
    amount,
  }: {
    address: OnChainAddress
    amount: Satoshis
  }): Promise<string>
  getTransaction({
    txid,
    include_watchonly,
  }: {
    txid: OnChainTxHash
    include_watchonly?: boolean
  }): Promise<InWalletTransaction>

  getBalance(): Promise<Satoshis>
  walletCreateFundedPsbt({
    inputs,
    outputs,
  }: {
    inputs: unknown[]
    outputs: Record<string, number>[]
  }): Promise<{ psbt: string }>
  walletProcessPsbt({ psbt }: { psbt: string }): Promise<{ psbt: string }>
  finalizePsbt({
    psbt,
  }: {
    psbt: string
  }): Promise<{ psbt: string; hex: string; complete: boolean }>

  // TODO can this be in IBitcoindService instead?
  generateToAddress({
    nblocks,
    address,
  }: {
    nblocks: number
    address: OnChainAddress
  }): Promise<[string]>
  // TODO can this be in IBitcoindService instead?
  sendRawTransaction({ hexstring }: { hexstring: string }): Promise<string>
}
