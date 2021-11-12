export const Role = {
  Owner: "owner",
} as const

export const AuthorizationScope = {
  Account: "account",
} as const

export const Permission = {
  Read: "read",
}

export const resourceIdFromAccountId = (accountId: AccountId): ResourceId =>
  `account/${accountId}` as ResourceId
