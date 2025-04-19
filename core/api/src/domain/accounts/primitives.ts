export const AccountLevel = {
  Zero: 0,
  One: 1,
  Two: 2,
  Three: 3,
} as const

export const AccountStatus = {
  New: "new",
  Invited: "invited",
  Pending: "pending",
  Active: "active",
  Locked: "locked",
  Closed: "closed",
} as const

export const AccountLimitsRange = {
  ONE_DAY: "ONE_DAY",
} as const

export const AccountLimitsType = {
  Withdrawal: "Withdrawal",
  IntraLedger: "IntraLedger",
  SelfTrade: "TradeIntraAccount",
} as const
