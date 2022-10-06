type BuildNumberInput = {
  minBuildNumber: number
  lastBuildNumber: number
}

type RateLimitInput = {
  points: number
  duration: number
  blockDuration: number
}

type AccountLimitsConfig = {
  level: {
    1: number
    2: number
  }
}

type YamlSchema = {
  PROXY_CHECK_APIKEY: string
  name: string
  lightningAddressDomain: string
  lightningAddressDomainAliases: string[]
  locale: string
  displayCurrency: {
    symbol: string
    code: string
  }
  funder: string
  dealer: {
    usd: {
      hedgingEnabled: boolean
    }
  }
  ratioPrecision: number
  buildVersion: {
    android: BuildNumberInput
    ios: BuildNumberInput
  }
  rewards: {
    denyPhoneCountries: string[]
    allowPhoneCountries: string[]
    denyIPCountries: string[]
    allowIPCountries: string[]
    denyASNs: string[]
    allowASNs: string[]
  }
  coldStorage: {
    minOnChainHotWalletBalance: number
    minRebalanceSize: number
    maxHotWalletBalance: number
    walletPattern: string
    onChainWallet: string
    targetConfirmations: number
  }
  lndScbBackupBucketName: string
  test_accounts: {
    ref: string
    phone: string
    code: string
    needUsdWallet?: boolean
    username?: string
    phoneMetadataCarrierType?: string
    title?: string
    role?: string
    currency?: string
  }[]
  rateLimits: {
    requestPhoneCodePerPhone: RateLimitInput
    requestPhoneCodePerPhoneMinInterval: RateLimitInput
    requestPhoneCodePerIp: RateLimitInput
    failedLoginAttemptPerPhone: RateLimitInput
    failedLoginAttemptPerEmailAddress: RateLimitInput
    failedLoginAttemptPerIp: RateLimitInput
    invoiceCreateAttempt: RateLimitInput
    invoiceCreateForRecipientAttempt: RateLimitInput
    onChainAddressCreateAttempt: RateLimitInput
  }
  accounts: {
    initialStatus: string
    initialWallets: WalletCurrency[]
  }
  accountLimits: {
    withdrawal: AccountLimitsConfig
    intraLedger: AccountLimitsConfig
    tradeIntraAccount: AccountLimitsConfig
  }
  spamLimits: {
    memoSharingSatsThreshold: number
    memoSharingCentsThreshold: number
  }
  twoFALimits: {
    threshold: number
  }
  ipRecording: {
    enabled: boolean
    proxyChecking: {
      enabled: boolean
    }
  }
  fees: {
    deposit: number
    withdraw: {
      method: string
      ratio: number
      threshold: number
      daysLookback: number
      defaultMin: number
    }
  }
  lnds: {
    name: string
    type: string[]
    priority: number
  }[]
  onChainWallet: {
    dustThreshold: number
    minConfirmations: number
    scanDepth: number
    scanDepthOutgoing: number
    scanDepthChannelUpdate: number
  }
  swap: {
    loopOutWhenHotWalletLessThan: number
    lnd1loopRestEndpoint: string
    lnd2loopRestEndpoint: string
    lnd1loopRpcEndpoint: string
    lnd2loopRpcEndpoint: string
    swapOutAmount: number
    swapProviders: Array<SwapProvider>
  }
  apollo: {
    playground: boolean
    playgroundUrl: string
  }
  userActivenessMonthlyVolumeThreshold: number
  cronConfig: {
    rebalanceEnabled: boolean
    swapEnabled: boolean
  }
  kratosConfig: {
    publicApi: string
    adminApi: string
    corsAllowedOrigins: string[]
  }
  oathkeeperConfig: {
    urlJkws: string
    decisionsApi: string
  }
  captcha: {
    mandatory: boolean
  }
  skipFeeProbe: Pubkey[]
}
