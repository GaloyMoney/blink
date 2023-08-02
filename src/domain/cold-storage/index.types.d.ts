type ColdStorageServiceError = import("./errors").ColdStorageServiceError

type RebalanceCheckerConfig = {
  minOnChainHotWalletBalance: Satoshis
  maxHotWalletBalance: Satoshis
  minRebalanceSize: Satoshis
}

type ColdStorageConfig = RebalanceCheckerConfig

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
