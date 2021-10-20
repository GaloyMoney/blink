import fs from "fs"
import yaml from "js-yaml"
import _ from "lodash"
import { exit } from "process"

import { baseLogger } from "@services/logger"

const defaultContent = fs.readFileSync("./default.yaml", "utf8")
export const defaultConfig = yaml.load(defaultContent)

export const JWT_SECRET = process.env.JWT_SECRET
export const BTC_NETWORK = process.env.NETWORK as BtcNetwork

export const MS_PER_HOUR = 60 * 60 * 1000
export const MS_PER_DAY = 24 * MS_PER_HOUR
export const MS_PER_30_DAYs = 30 * MS_PER_DAY

export const SECS_PER_5_MINS = (60 * 5) as Seconds

export const SUBSCRIPTION_POLLING_INTERVAL = 2.5 * 1000
export const MAX_BYTES_FOR_MEMO = 639 // BOLT

export const SAT_USDCENT_PRICE = "SAT-USDCENT-PRICE"
export const lnPaymentStatusEvent = (paymentHash: PaymentHash) =>
  `LN-PAYMENT-STATUS-${paymentHash}`

let customContent, customConfig

try {
  customContent = fs.readFileSync("/var/yaml/custom.yaml", "utf8")
  customConfig = yaml.load(customContent)
} catch (err) {
  if (process.env.NETWORK !== "regtest") {
    baseLogger.info({ err }, "no custom.yaml available. loading default values")
  }
}

export const yamlConfig = _.merge(defaultConfig, customConfig)

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

export const getGaloySMSProvider = (): string => yamlConfig.sms_provider

export const getGeeTestConfig = () => {
  const config = {
    id: process.env.GEETEST_ID,
    key: process.env.GEETEST_KEY,
  }
  if (!config.id || !config.key) {
    throw new Error("Geetest config not found")
  }
  return config
}

export const getLndParams = (): LndParams[] => {
  const config = yamlConfig.lnds
  return config.map((input) => ({
    cert: process.env[`${input.name}_TLS`] || exit(98),
    macaroon: process.env[`${input.name}_MACAROON`] || exit(98),
    node: process.env[`${input.name}_DNS`] || exit(98),
    port: process.env[`${input.name}_RPCPORT`] ?? 10009,
    pubkey: process.env[`${input.name}_PUBKEY`] || exit(98),
    priority: 1,
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

const getRateLimits = (config): IRateLimits => {
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

export const getRequestPhoneCodeLimits = () =>
  getRateLimits(yamlConfig.limits.requestPhoneCode)

export const getRequestPhoneCodeIpLimits = () =>
  getRateLimits(yamlConfig.limits.requestPhoneCodeIp)

export const getLoginAttemptLimits = () => getRateLimits(yamlConfig.limits.loginAttempt)

export const getFailedAttemptPerIpLimits = () =>
  getRateLimits(yamlConfig.limits.failedAttemptPerIp)

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

export const getBuildVersions = (): {
  minBuildNumber: number
  lastBuildNumber: number
} => {
  return yamlConfig.buildVersion
}

export const PROXY_CHECK_APIKEY = yamlConfig?.PROXY_CHECK_APIKEY

export const getIpConfig = (config = yamlConfig): IpConfig => ({
  ipRecordingEnabled:
    process.env.NODE_ENV === "test" ? false : config.ipRecording?.enabled,
  proxyCheckingEnabled: config.ipRecording?.proxyChecking?.enabled,
})

export const getHelmetConfig = (config = yamlConfig): HelmetConfig => config.helmet
export const getTwoFAConfig = (config = yamlConfig): TwoFAConfig => config.twoFA

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
