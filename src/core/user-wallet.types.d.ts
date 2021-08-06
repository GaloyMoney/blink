type UserWalletConfig = {
  dustThreshold: number
  onchainMinConfirmations: number
  limits: ITransactionLimits
  name: string
}

type UserWalletConstructorArgs = {
  user: UserType
  logger: Logger
  config: UserWalletConfig
}
