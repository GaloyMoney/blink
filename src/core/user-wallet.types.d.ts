type UserWalletConfig = {
  dustThreshold: number
  onchainMinConfirmations: number
  limits: ITransactionLimits
  name: string
}

type UserWalletConstructorArgs = {
  user: UserRecord
  logger: Logger
  config: UserWalletConfig
}
