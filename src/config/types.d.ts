type IpConfig = {
  ipRecordingEnabled: boolean
  proxyCheckingEnabled: boolean
}

type Levels = number[]

type CronConfig = {
  rebalanceEnabled: boolean
  swapEnabled: boolean
}

type KratosConfig = {
  adminApi: string
  publicApi: string
  corsAllowedOrigins: string[]
}

type CaptchaConfig = {
  mandatory: boolean
}

type ApolloConfig = {
  playground: boolean
  playgroundUrl: string
}

type TwoFAConfig = {
  threshold: number
}

type AccountsConfig = {
  initialStatus: AccountStatus
  initialWallets: WalletCurrency[]
}
