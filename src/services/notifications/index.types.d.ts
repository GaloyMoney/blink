type NotificationsDataObject = {
  walletId: WalletId
  txNotificationType: NotificationType
  walletAmount: string
  walletCurrency: WalletCurrency
  displayAmount: DisplayCurrencyMajorAmount | undefined
  displayCurrency: DisplayCurrency | undefined
  // TODO: remove deprecated
  displayCurrencyPerSat?: number
  sats?: Satoshis
  cents?: UsdCents
  txHash?: OnChainTxHash
  amount?: string
  currency?: WalletCurrency
}
