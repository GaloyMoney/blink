type ColdStorageConfig = RebalanceCheckerConfig & {
  walletPattern: string
  onchainWallet: string
  targetConfirmations: number
}

type SpecterWalletConstructorArgs = {
  config: ColdStorageConfig
  logger: Logger
}
