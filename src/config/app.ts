import fs from "fs"

import yaml from "js-yaml"
import merge from "lodash.merge"

import { baseLogger } from "@services/logger"
import { checkedToScanDepth } from "@domain/bitcoin/onchain"
import { toSats } from "@domain/bitcoin"

const defaultContent = fs.readFileSync("./default.yaml", "utf8")
export const defaultConfig = yaml.load(defaultContent)

export class ConfigError extends Error {
  name = this.constructor.name
}

export const GALOY_API_PORT = process.env.GALOY_API_PORT || 4002
export const GALOY_ADMIN_PORT = process.env.GALOY_ADMIN_PORT || 4001

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  throw new ConfigError("missing JWT_SECRET")
}

export const JWT_SECRET = jwtSecret

const btcNetwork = process.env.NETWORK
const networks = ["mainnet", "testnet", "regtest"]
if (!!btcNetwork && !networks.includes(btcNetwork)) {
  throw new ConfigError(`missing or invalid NETWORK: ${btcNetwork}`)
}

export const BTC_NETWORK = btcNetwork as BtcNetwork

export const MS_PER_HOUR = (60 * 60 * 1000) as MilliSeconds
export const MS_PER_DAY = (24 * MS_PER_HOUR) as MilliSeconds
export const MS_PER_30_DAYS = (30 * MS_PER_DAY) as MilliSeconds

export const SECS_PER_2_MINS = (60 * 2) as Seconds
export const SECS_PER_5_MINS = (60 * 5) as Seconds
export const SECS_PER_DAY = (60 * 60 * 24) as Seconds

export const VALIDITY_TIME_CODE = (20 * 60) as Seconds

export const MAX_BYTES_FOR_MEMO = 639 // BOLT

export const SAT_USDCENT_PRICE = "SAT-USDCENT-PRICE"
export const USER_PRICE_UPDATE_EVENT = "USER-PRICE-UPDATE-EVENT"
export const SAT_PRICE_PRECISION_OFFSET = 12
export const BTC_PRICE_PRECISION_OFFSET = 4

export const lnPaymentStatusEvent = (paymentHash: PaymentHash) =>
  `LN-PAYMENT-STATUS-${paymentHash}`

export const accountUpdateEvent = (accountId: AccountId) => `ACCOUNT_UPDATE-${accountId}`

let customContent, customConfig

try {
  customContent = fs.readFileSync("/var/yaml/custom.yaml", "utf8")
  customConfig = yaml.load(customContent)
} catch (err) {
  if (process.env.NETWORK !== "regtest") {
    baseLogger.info({ err }, "no custom.yaml available. using default values")
  }
}

export const yamlConfig = merge(defaultConfig, customConfig)

export const tracingConfig = {
  jaegerHost: process.env.JAEGER_HOST || "localhost",
  jaegerPort: parseInt(process.env.JAEGER_PORT || "6832", 10),
  tracingServiceName: process.env.TRACING_SERVICE_NAME || "galoy-dev",
}
export const MEMO_SHARING_SATS_THRESHOLD = yamlConfig.limits.memoSharingSatsThreshold

export const ONCHAIN_MIN_CONFIRMATIONS = yamlConfig.onChainWallet.minConfirmations
// how many block are we looking back for getChainTransactions
const getOnChainScanDepth = (val: number): ScanDepth => {
  const scanDepth = checkedToScanDepth(val)
  if (scanDepth instanceof Error) throw scanDepth
  return scanDepth
}
export const ONCHAIN_SCAN_DEPTH = getOnChainScanDepth(yamlConfig.onChainWallet.scanDepth)
export const ONCHAIN_SCAN_DEPTH_OUTGOING = getOnChainScanDepth(
  yamlConfig.onChainWallet.scanDepthOutgoing,
)
export const ONCHAIN_SCAN_DEPTH_CHANNEL_UPDATE = getOnChainScanDepth(
  yamlConfig.onChainWallet.scanDepthChannelUpdate,
)

export const USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD = toSats(
  yamlConfig.userActivenessMonthlyVolumeThreshold,
)

export const getGaloyInstanceName = (): string => yamlConfig.name

export const getGeetestConfig = () => {
  const config = {
    id: process.env.GEETEST_ID,
    key: process.env.GEETEST_KEY,
  }
  // FIXME: Geetest should be optional.
  if (!config.id || !config.key) {
    throw new ConfigError("Geetest config not found")
  }
  return config
}

export const getLndParams = (): LndParams[] => {
  const config = yamlConfig.lnds

  config.forEach((input) => {
    const keys = ["_TLS", "_MACAROON", "_DNS", "_PUBKEY"]
    keys.forEach((key) => {
      if (!process.env[`${input.name}${key}`]) {
        throw new ConfigError(`lnd params missing for: ${input.name}${key}`)
      }
    })
  })

  return config.map((input) => ({
    cert: process.env[`${input.name}_TLS`],
    macaroon: process.env[`${input.name}_MACAROON`],
    node: process.env[`${input.name}_DNS`],
    port: process.env[`${input.name}_RPCPORT`] ?? 10009,
    pubkey: process.env[`${input.name}_PUBKEY`],
    priority: 1, // will be overridden if present in the yaml
    ...input,
  }))
}

export const getFeeRates = (feesConfig = yamlConfig.fees): FeeRates => ({
  depositFeeVariable: feesConfig.deposit,
  depositFeeFixed: 0,
  withdrawFeeVariable: 0,
  withdrawFeeFixed: feesConfig.withdraw,
})

export const getUserLimits = ({
  level,
  limitsConfig = yamlConfig.limits,
}: UserLimitsArgs): IUserLimits => {
  return {
    onUsLimit: limitsConfig.onUs.level[level] as Satoshis,
    withdrawalLimit: limitsConfig.withdrawal.level[level] as Satoshis,
  }
}

export const getTwoFALimits = (): TwoFALimits => ({
  threshold: yamlConfig.twoFA.threshold,
})

const getRateLimits = (config): RateLimitOptions => {
  /**
   * Returns a subset of the required parameters for the
   * 'rate-limiter-flexible.RateLimiterRedis' object.
   */
  return {
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration,
  }
}

export const getRequestPhoneCodePerPhoneLimits = () =>
  getRateLimits(yamlConfig.limits.requestPhoneCodePerPhone)

export const getRequestPhoneCodePerPhoneMinIntervalLimits = () =>
  getRateLimits(yamlConfig.limits.requestPhoneCodePerPhoneMinInterval)

export const getRequestPhoneCodePerIpLimits = () =>
  getRateLimits(yamlConfig.limits.requestPhoneCodePerIp)

export const getFailedLoginAttemptPerPhoneLimits = () =>
  getRateLimits(yamlConfig.limits.failedLoginAttemptPerPhone)

export const getFailedLoginAttemptPerIpLimits = () =>
  getRateLimits(yamlConfig.limits.failedLoginAttemptPerIp)

export const getInvoiceCreateAttemptLimits = () =>
  getRateLimits(yamlConfig.limits.invoiceCreateAttempt)

export const getInvoiceCreateForRecipientAttemptLimits = () =>
  getRateLimits(yamlConfig.limits.invoiceCreateForRecipientAttempt)

export const getOnChainAddressCreateAttemptLimits = () =>
  getRateLimits(yamlConfig.limits.onChainAddressCreateAttempt)

export const getOnChainWalletConfig = () => ({
  dustThreshold: yamlConfig.onChainWallet.dustThreshold,
})

export const getTransactionLimits = ({
  level,
  limitsConfig = yamlConfig.limits,
}: UserLimitsArgs): ITransactionLimits => {
  return {
    ...getUserLimits({ level, limitsConfig }),
  }
}

export const getUserWalletConfig = (
  user,
  limitsConfig = yamlConfig.limits,
): UserWalletConfig => {
  const transactionLimits = getTransactionLimits({ level: user.level, limitsConfig })
  const onChainWalletConfig = getOnChainWalletConfig()
  return {
    name: yamlConfig.name,
    dustThreshold: onChainWalletConfig.dustThreshold,
    onchainMinConfirmations: ONCHAIN_MIN_CONFIRMATIONS,
    limits: transactionLimits,
  }
}

export const getSpecterWalletConfig = (): SpecterWalletConfig => {
  const config = yamlConfig.rebalancing
  return {
    minOnChainHotWalletBalance: toSats(config.minOnChainHotWalletBalance),
    maxHotWalletBalance: toSats(config.maxHotWalletBalance),
    minRebalanceSize: toSats(config.minRebalanceSize),
    onchainWallet: config.onchainWallet,
  }
}

type TwilioConfig = {
  accountSid: string
  authToken: string
  twilioPhoneNumber: string
}

export const getTwilioConfig = (): TwilioConfig => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !twilioPhoneNumber) {
    throw new ConfigError("missing key for twilio")
  }

  return {
    accountSid,
    authToken,
    twilioPhoneNumber,
  }
}

export const getBuildVersions = (): {
  minBuildNumberAndroid: number
  lastBuildNumberAndroid: number
  minBuildNumberIos: number
  lastBuildNumberIos: number
} => {
  const { android, ios } = yamlConfig.buildVersion

  return {
    minBuildNumberAndroid: android.minBuildNumber,
    lastBuildNumberAndroid: android.lastBuildNumber,
    minBuildNumberIos: ios.minBuildNumber,
    lastBuildNumberIos: ios.lastBuildNumber,
  }
}

export const PROXY_CHECK_APIKEY = yamlConfig?.PROXY_CHECK_APIKEY

// FIXME: we have process.env.NODE_ENV === "production" | "development" | "test"
// "test" might not be needed

export const isProd = process.env.NODE_ENV === "production"
export const isDev = process.env.NODE_ENV === "development"

export const getIpConfig = (config = yamlConfig): IpConfig => ({
  ipRecordingEnabled:
    process.env.NODE_ENV === "test" ? false : config.ipRecording?.enabled,
  proxyCheckingEnabled: config.ipRecording?.proxyChecking?.enabled,
})

export const getApolloConfig = (config = yamlConfig): ApolloConfig => config.apollo
export const getTwoFAConfig = (config = yamlConfig): TwoFAConfig => config.twoFA

export const getTestAccounts = (config = yamlConfig): TestAccount[] =>
  config.test_accounts

export const levels: Levels = [1, 2]

// onboarding
export const onboardingEarn: Record<string, Satoshis> = {
  walletDownloaded: 1 as Satoshis,
  walletActivated: 1 as Satoshis,
  whatIsBitcoin: 1 as Satoshis,
  sat: 2 as Satoshis,
  whereBitcoinExist: 5 as Satoshis,
  whoControlsBitcoin: 5 as Satoshis,
  copyBitcoin: 5 as Satoshis,
  moneyImportantGovernement: 10 as Satoshis,
  moneyIsImportant: 10 as Satoshis,
  whyStonesShellGold: 10 as Satoshis,
  moneyEvolution: 10 as Satoshis,
  coincidenceOfWants: 10 as Satoshis,
  moneySocialAggrement: 10 as Satoshis,
  WhatIsFiat: 10 as Satoshis,
  whyCareAboutFiatMoney: 10 as Satoshis,
  GovernementCanPrintMoney: 10 as Satoshis,
  FiatLosesValueOverTime: 10 as Satoshis,
  OtherIssues: 10 as Satoshis,
  LimitedSupply: 20 as Satoshis,
  Decentralized: 20 as Satoshis,
  NoCounterfeitMoney: 20 as Satoshis,
  HighlyDivisible: 20 as Satoshis,
  securePartOne: 20 as Satoshis,
  securePartTwo: 20 as Satoshis,
}
