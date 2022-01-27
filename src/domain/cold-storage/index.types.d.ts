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
