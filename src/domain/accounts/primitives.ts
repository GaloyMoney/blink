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
} as const

export const AccountLimitsType = {
  Withdrawal: "Withdrawal",
  IntraLedger: "IntraLedger",
  SelfTrade: "TradeIntraAccount",
} as const
