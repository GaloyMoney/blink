import fs from "fs"
import yaml from "js-yaml"
import merge from "lodash.merge"

import { baseLogger } from "@services/logger"

const defaultContent = fs.readFileSync("./default.yaml", "utf8")
export const defaultConfig = yaml.load(defaultContent)

export class ConfigError extends Error {
  name = this.constructor.name
}

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

export const MS_PER_HOUR = 60 * 60 * 1000
export const MS_PER_DAY = 24 * MS_PER_HOUR
export const MS_PER_30_DAYs = 30 * MS_PER_DAY

export const SECS_PER_5_MINS = (60 * 5) as Seconds

export const VALIDITY_TIME_CODE = (20 * 60) as Seconds

export const MAX_BYTES_FOR_MEMO = 639 // BOLT

export const SATS_PER_BTC = 10 ** 8
export const SAT_USDCENT_PRICE = "SAT-USDCENT-PRICE"
export const USER_PRICE_UPDATE_EVENT = "USER-PRICE-UPDATE-EVENT"

export const lnPaymentStatusEvent = (paymentHash: PaymentHash) =>
  `LN-PAYMENT-STATUS-${paymentHash}`

export const walletUpdateEvent = (walletId: WalletId) => `WALLET_UPDATE-${walletId}`

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
export const ONCHAIN_LOOK_BACK = yamlConfig.onChainWallet.lookBack
export const ONCHAIN_LOOK_BACK_OUTGOING = yamlConfig.onChainWallet.lookBackOutgoing
export const ONCHAIN_LOOK_BACK_CHANNEL_UPDATE =
  yamlConfig.onChainWallet.lookBackChannelUpdate

export const USER_ACTIVENESS_MONTHLY_VOLUME_THRESHOLD =
  yamlConfig.userActivenessMonthlyVolumeThreshold

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
    priority: 1, // will be overriden if present in the yaml
    ...input,
  }))
}

export const getGenericLimits = (limitsConfig = yamlConfig.limits): GenericLimits => ({
  oldEnoughForWithdrawalHours: limitsConfig.oldEnoughForWithdrawal / MS_PER_HOUR,
  oldEnoughForWithdrawalMicroseconds: limitsConfig.oldEnoughForWithdrawal,
})

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
    onUsLimit: limitsConfig.onUs.level[level],
    withdrawalLimit: limitsConfig.withdrawal.level[level],
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
  const genericLimits = getGenericLimits(limitsConfig)
  return {
    oldEnoughForWithdrawalMicroseconds: genericLimits.oldEnoughForWithdrawalMicroseconds,
    oldEnoughForWithdrawalHours: genericLimits.oldEnoughForWithdrawalHours,
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
    lndHoldingBase: config.lndHoldingBase,
    ratioTargetDeposit: config.ratioTargetDeposit,
    ratioTargetWithdraw: config.ratioTargetWithdraw,
    minOnchain: config.minOnchain,
    onchainWallet: config.onchainWallet ?? "specter",
  }
}

type TwilioConfig = {
  accountSid: string
  apiKey: string
  apiSecret: string
  twilioPhoneNumber: string
}

export const getTwilioConfig = (): TwilioConfig => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const apiKey = process.env.TWILIO_API_KEY
  const apiSecret = process.env.TWILIO_API_SECRET
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !apiKey || !apiSecret || !twilioPhoneNumber) {
    throw new ConfigError("missing key for twilio")
  }

  return {
    accountSid,
    apiKey,
    apiSecret,
    twilioPhoneNumber,
  }
}

export const getBuildVersions = (): {
  minBuildNumber: number
  lastBuildNumber: number
} => {
  return yamlConfig.buildVersion
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

export const getTestAccounts = (config = yamlConfig): TestAccounts[] =>
  config.test_accounts

export const levels: Levels = [1, 2]

// onboarding
export const onboardingEarn = {
  walletDownloaded: 1,
  walletActivated: 1,
  whatIsBitcoin: 1,
  sat: 2,
  whereBitcoinExist: 5,
  whoControlsBitcoin: 5,
  copyBitcoin: 5,
  moneyImportantGovernement: 10,
  moneyIsImportant: 10,
  whyStonesShellGold: 10,
  moneyEvolution: 10,
  coincidenceOfWants: 10,
  moneySocialAggrement: 10,

  WhatIsFiat: 10,
  whyCareAboutFiatMoney: 10,
  GovernementCanPrintMoney: 10,
  FiatLosesValueOverTime: 10,
  OtherIssues: 10,
  LimitedSupply: 20,
  Decentralized: 20,
  NoCounterfeitMoney: 20,
  HighlyDivisible: 20,
  securePartOne: 20,
  securePartTwo: 20,
}
