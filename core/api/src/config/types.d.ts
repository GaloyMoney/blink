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

type RewardsConfig = {
  phoneMetadataValidationSettings: PhoneMetadataValidationSettings
  ipMetadataValidationSettings: IpMetadataValidationSettings
}

type PhoneMetadataValidationSettings = {
  denyCountries: string[]
  allowCountries: string[]
}

type IpMetadataValidationSettings = {
  denyCountries: string[]
  allowCountries: string[]
  denyASNs: string[]
  allowASNs: string[]
  checkProxy: boolean
}

type AccountsConfig = {
  initialStatus: AccountStatus
  initialWallets: WalletCurrency[]
  initialLevel: AccountLevel
}

type AccountsOnboardConfig = {
  phoneMetadataValidationSettings: AccountsOnboardPhoneMetadataConfig
  ipMetadataValidationSettings: AccountsOnboardIpMetadataConfig
}

type AccountsOnboardPhoneMetadataConfig = PhoneMetadataValidationSettings & {
  enabled: boolean
}

type AccountsOnboardIpMetadataConfig = IpMetadataValidationSettings & {
  enabled: boolean
}
