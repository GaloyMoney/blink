import { toDays } from "@domain/primitives"

export * from "./error"
export * from "./process"
export * from "./yaml"
export * from "./schema"
export * from "./utils"

export const MS_PER_HOUR = (60 * 60 * 1000) as MilliSeconds
export const MS_PER_DAY = (24 * MS_PER_HOUR) as MilliSeconds
export const TWO_MONTHS_IN_MS = (60 * MS_PER_DAY) as MilliSeconds

export const SECS_PER_MIN = 60 as Seconds
export const SECS_PER_5_MINS = (60 * 5) as Seconds
export const SECS_PER_10_MINS = (SECS_PER_5_MINS * 2) as Seconds

export const ONE_DAY = toDays(1)

export const MAX_AGE_TIME_CODE = (20 * 60) as Seconds

export const MAX_BYTES_FOR_MEMO = 639 // BOLT

export const SAT_PRICE_PRECISION_OFFSET = 12
export const BTC_PRICE_PRECISION_OFFSET = 4

export const MIN_SATS_FOR_PRICE_RATIO_PRECISION = 5000n

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
