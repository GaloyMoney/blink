export const AccountLevel = {
  One: 1,
  Two: 2,
} as const

export const AccountStatus = {
  New: "new",
  Pending: "pending",
  Active: "active",
  Locked: "locked",
} as const

export const AccountLimitsRange = {
  ONE_DAY: "ONE_DAY",
  ONE_WEEK: "ONE_WEEK",
  // ONE_MONTH: "ONE_MONTH",
  // ONE_YEAR: "ONE_YEAR",
  // FIVE_YEARS: "FIVE_YEARS",
} as const
