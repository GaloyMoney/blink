export * from "./errors"
export * from "./api-keys"

export const AccountLevel = {
  One: 1,
  Two: 2,
} as const

export const AccountStatus = {
  Locked: "locked",
  Active: "active",
} as const
