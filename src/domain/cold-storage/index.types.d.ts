type ColdStorageServiceError = import("./errors").ColdStorageServiceError

type Psbt = string & { readonly brand: unique symbol }

type ColdStoragePsbt = {
  psbt: Psbt
  fee: Satoshis
}

type RebalanceCheckerConfig = {
  minOnChainHotWalletBalance: Satoshis
  maxHotWalletBalance: Satoshis
  minRebalanceSize: Satoshis
}

type RebalanceChecker = {
  getWithdrawFromHotWalletAmount({
    onChainHotWalletBalance,
    offChainHotWalletBalance,
  }: {
    onChainHotWalletBalance: Satoshis
    offChainHotWalletBalance: Satoshis
  }): Satoshis
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
  getBalances(): Promise<ColdStorageBalance[] | ColdStorageServiceError>
  createPsbt({
    walletName,
    onChainAddress,
    amount,
  }: GetColdStoragePsbtArgs): Promise<ColdStoragePsbt | ColdStorageServiceError>
  createOnChainAddress(): Promise<OnChainAddress | ColdStorageServiceError>
}
