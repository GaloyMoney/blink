import { toDays } from "@domain/primitives"

import { SvixConfig } from "@services/callback"

import { getBriaPartialConfigFromProcess } from "./process"
import {
  getBriaPartialConfigFromYaml,
  MEMO_SHARING_CENTS_THRESHOLD,
  MEMO_SHARING_SATS_THRESHOLD,
} from "./yaml"

export * from "./error"
export * from "./process"
export * from "./yaml"
export * from "./schema"
export * from "./utils"

export const MS_PER_SEC = 1000 as MilliSeconds
export const MS_PER_HOUR = (60 * 60 * MS_PER_SEC) as MilliSeconds
export const MS_PER_DAY = (24 * MS_PER_HOUR) as MilliSeconds
export const TWO_MONTHS_IN_MS = (60 * MS_PER_DAY) as MilliSeconds

export const SECS_PER_MIN = 60 as Seconds
export const SECS_PER_5_MINS = (60 * 5) as Seconds
export const SECS_PER_10_MINS = (SECS_PER_5_MINS * 2) as Seconds
export const SECS_PER_DAY = (24 * 60 * 60) as Seconds

export const ONE_DAY = toDays(1)

export const MAX_BYTES_FOR_MEMO = 639 // BOLT
export const MAX_LENGTH_FOR_FEEDBACK = 1024

export const MIN_SATS_FOR_PRICE_RATIO_PRECISION = 5000n

export const Levels: Levels = [0, 1, 2]

// onboarding
export const OnboardingEarn: Record<QuizQuestionId, Satoshis> = {
  walletDownloaded: 1 as Satoshis,
  walletActivated: 1 as Satoshis,
  whatIsBitcoin: 1 as Satoshis,
  sat: 2 as Satoshis,
  whereBitcoinExist: 3 as Satoshis,
  whoControlsBitcoin: 3 as Satoshis,
  copyBitcoin: 3 as Satoshis,
  moneyImportantGovernement: 4 as Satoshis,
  moneyIsImportant: 4 as Satoshis,
  whyStonesShellGold: 4 as Satoshis,
  moneyEvolution: 4 as Satoshis,
  coincidenceOfWants: 4 as Satoshis,
  moneySocialAggrement: 4 as Satoshis,
  WhatIsFiat: 5 as Satoshis,
  whyCareAboutFiatMoney: 5 as Satoshis,
  GovernementCanPrintMoney: 5 as Satoshis,
  FiatLosesValueOverTime: 5 as Satoshis,
  OtherIssues: 5 as Satoshis,
  LimitedSupply: 6 as Satoshis,
  Decentralized: 6 as Satoshis,
  NoCounterfeitMoney: 6 as Satoshis,
  HighlyDivisible: 6 as Satoshis,
  securePartOne: 6 as Satoshis,
  securePartTwo: 6 as Satoshis,
} as const

export const memoSharingConfig = {
  memoSharingSatsThreshold: MEMO_SHARING_SATS_THRESHOLD,
  memoSharingCentsThreshold: MEMO_SHARING_CENTS_THRESHOLD,
  authorizedMemos: Object.keys(OnboardingEarn),
} as const

export const getBriaConfig = () => ({
  ...getBriaPartialConfigFromProcess(),
  ...getBriaPartialConfigFromYaml(),
})

export const getCallbackServiceConfig = (): SvixConfig => {
  // FIXME type when env.ts PR is merged
  const secret = process.env.SVIX_SECRET as string
  const endpoint = process.env.SVIX_ENDPOINT as string
  return { secret, endpoint }
}
