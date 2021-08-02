type SpecterWalletConfig = {
  lndHoldingBase: number
  ratioTargetDeposit: number
  ratioTargetWithdraw: number
  minOnchain: number
  onchainWallet: string
}

type SpecterWalletConstructorArgs = {
  config: SpecterWalletConfig
  logger: Logger
}
