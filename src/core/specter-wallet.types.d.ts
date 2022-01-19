type ColdStorageConfig = RebalanceCheckerConfig & {
  onchainWallet: string
  targetConfirmations: number
}

type SpecterWalletConstructorArgs = {
  config: ColdStorageConfig
  logger: Logger
}
