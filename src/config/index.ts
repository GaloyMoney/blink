export * from "./error"
export * from "./process"
export * from "./yaml"

export const MS_PER_HOUR = (60 * 60 * 1000) as MilliSeconds
export const MS_PER_DAY = (24 * MS_PER_HOUR) as MilliSeconds

export const SECS_PER_2_MINS = (60 * 2) as Seconds
export const SECS_PER_5_MINS = (60 * 5) as Seconds
export const SECS_PER_DAY = (60 * 60 * 24) as Seconds

export const VALIDITY_TIME_CODE = (20 * 60) as Seconds

export const MAX_BYTES_FOR_MEMO = 639 // BOLT

export const SAT_USDCENT_PRICE = "SAT-USDCENT-PRICE"
export const USER_PRICE_UPDATE_EVENT = "USER-PRICE-UPDATE-EVENT"
export const SAT_PRICE_PRECISION_OFFSET = 12
export const BTC_PRICE_PRECISION_OFFSET = 4

export const levels: Levels = [1, 2]

// onboarding
export const onboardingEarn: Record<string, Satoshis> = {
  walletDownloaded: 1n as Satoshis,
  walletActivated: 1n as Satoshis,
  whatIsBitcoin: 1n as Satoshis,
  sat: 2n as Satoshis,
  whereBitcoinExist: 5n as Satoshis,
  whoControlsBitcoin: 5n as Satoshis,
  copyBitcoin: 5n as Satoshis,
  moneyImportantGovernement: 10n as Satoshis,
  moneyIsImportant: 10n as Satoshis,
  whyStonesShellGold: 10n as Satoshis,
  moneyEvolution: 10n as Satoshis,
  coincidenceOfWants: 10n as Satoshis,
  moneySocialAggrement: 10n as Satoshis,
  WhatIsFiat: 10n as Satoshis,
  whyCareAboutFiatMoney: 10n as Satoshis,
  GovernementCanPrintMoney: 10n as Satoshis,
  FiatLosesValueOverTime: 10n as Satoshis,
  OtherIssues: 10n as Satoshis,
  LimitedSupply: 20n as Satoshis,
  Decentralized: 20n as Satoshis,
  NoCounterfeitMoney: 20n as Satoshis,
  HighlyDivisible: 20n as Satoshis,
  securePartOne: 20n as Satoshis,
  securePartTwo: 20n as Satoshis,
}
