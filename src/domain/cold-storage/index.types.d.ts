type ColdStorageServiceError = import("./errors").ColdStorageServiceError

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

interface IColdStorageService {
  getBalance(): Promise<Satoshis | ColdStorageServiceError>
  createOnChainAddress(): Promise<OnChainAddress | ColdStorageServiceError>
}
