type IpConfig = {
  ipRecordingEnabled: boolean
  proxyCheckingEnabled: boolean
}

type Levels = number[]

type CronConfig = {
  rebalanceEnabled: boolean
  swapEnabled: boolean
}

type CaptchaConfig = {
  mandatory: boolean
}

type ApolloConfig = {
  playground: boolean
  playgroundUrl: string
}

type AccountsConfig = {
  initialStatus: AccountStatus
  initialWallets: WalletCurrency[]
  initialLevel: AccountLevel
}
