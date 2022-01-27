type SpecterWalletConfig = RebalanceCheckerConfig & {
  onchainWallet: string
}

type SpecterWalletConstructorArgs = {
  config: SpecterWalletConfig
  logger: Logger
}
