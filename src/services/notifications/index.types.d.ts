type NotificationsDataObject = {
  walletId: WalletId
  txNotificationType: NotificationType
  walletAmount: string
  walletCurrency: WalletCurrency
  displayAmount: DisplayCurrencyMajorAmount | undefined
  displayCurrency: DisplayCurrency | undefined
  displayCurrencyPerSat?: number
  sats?: Satoshis
  cents?: UsdCents
  txHash?: OnChainTxHash
}
