type NotificationsDataObject = {
  walletId: WalletId
  txNotificationType: NotificationType
  amount: number
  currency: WalletCurrency
  displayAmount: DisplayCurrencyMajorAmount | undefined
  displayCurrency: DisplayCurrency | undefined
  displayCurrencyPerSat?: number
  sats?: Satoshis
  cents?: UsdCents
  txHash?: OnChainTxHash
  transaction: WalletTransaction
}
