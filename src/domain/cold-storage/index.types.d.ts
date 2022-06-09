type ColdStorageServiceError = import("./errors").ColdStorageServiceError

type Psbt = string & { readonly brand: unique symbol }

type ColdStoragePsbt = {
  transaction: Psbt
  fee: Satoshis
}

type RebalanceCheckerConfig = {
  minOnChainHotWalletBalance: Satoshis
  maxHotWalletBalance: Satoshis
  minRebalanceSize: Satoshis
}

type ColdStorageConfig = RebalanceCheckerConfig & {
  walletPattern: string
  onChainWallet: string
  targetConfirmations: TargetConfirmations
}

type WithdrawFromHotWalletAmountArgs = {
  onChainHotWalletBalance: Satoshis
  offChainHotWalletBalance: Satoshis
}

type RebalanceChecker = {
  getWithdrawFromHotWalletAmount({
    onChainHotWalletBalance,
    offChainHotWalletBalance,
  }: WithdrawFromHotWalletAmountArgs): Satoshis
}

type ColdStorageBalance = {
  walletName: string
  amount: Satoshis
}

type GetColdStoragePsbtArgs = {
  walletName: string
  onChainAddress: OnChainAddress
  amount: Satoshis
  targetConfirmations: TargetConfirmations
}

interface IColdStorageService {
  listWallets(): Promise<string[] | ColdStorageServiceError>
  getBalances(): Promise<ColdStorageBalance[] | ColdStorageServiceError>
  getBalance(walletName: string): Promise<ColdStorageBalance | ColdStorageServiceError>
  createPsbt({
    walletName,
    onChainAddress,
    amount,
  }: GetColdStoragePsbtArgs): Promise<ColdStoragePsbt | ColdStorageServiceError>
  createOnChainAddress(): Promise<OnChainAddress | ColdStorageServiceError>
  isDerivedAddress(address: OnChainAddress): Promise<boolean | ColdStorageServiceError>
  isWithdrawalTransaction(
    txHash: OnChainTxHash,
  ): Promise<boolean | ColdStorageServiceError>
  lookupTransactionFee(txHash: OnChainTxHash): Promise<Satoshis | ColdStorageServiceError>
}
