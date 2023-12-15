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
    enableIpProxyCheck: boolean
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
  }
  bria: {
    hotWalletName: string
    queueNames: {
      fast: string
    }
    coldStorage: {
      walletName: string
      hotToColdRebalanceQueueName: string
    }
  }
  lndScbBackupBucketName: string
  admin_accounts: {
    role: string
    phone: string
  }[]
  test_accounts: {
    phone: string
    code: string
  }[]
  rateLimits: {
    requestCodePerLoginIdentifier: RateLimitInput
    requestCodePerIp: RateLimitInput
    failedLoginAttemptPerLoginIdentifier: RateLimitInput
    failedLoginAttemptPerIp: RateLimitInput
    invoiceCreateAttempt: RateLimitInput
    invoiceCreateForRecipientAttempt: RateLimitInput
    onChainAddressCreateAttempt: RateLimitInput
    deviceAccountCreateAttempt: RateLimitInput
    requestCodePerAppcheckJti: RateLimitInput
    addEarnPerIp: RateLimitInput
  }
  accounts: {
    initialStatus: string
    initialWallets: WalletCurrency[]
    enablePhoneCheck: boolean
    enableIpCheck: boolean
    enableIpProxyCheck: boolean
    denyPhoneCountries: string[]
    allowPhoneCountries: string[]
    denyIPCountries: string[]
    allowIPCountries: string[]
    denyASNs: string[]
    allowASNs: string[]
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
  ipRecording: {
    enabled: boolean
    proxyChecking: {
      enabled: boolean
    }
  }
  fees: {
    deposit: {
      defaultMin: number
      threshold: number
      ratioAsBasisPoints: number
    }
    withdraw: {
      method: string
      ratioAsBasisPoints: number
      threshold: number
      daysLookback: number
      defaultMin: number
    }
  }
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
    feeAccountingEnabled: boolean
  }
  userActivenessMonthlyVolumeThreshold: number
  cronConfig: {
    rebalanceEnabled: boolean
    swapEnabled: boolean
  }
  captcha: {
    mandatory: boolean
  }
  skipFeeProbeConfig: { pubkey: string[]; chanId: string[] }
  smsAuthUnsupportedCountries: string[]
  whatsAppAuthUnsupportedCountries: string[]
}
