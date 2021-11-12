export const Role = {
  Owner: "owner",
} as const

export const Permission = {
  Read: "read",
}

export const scopeFromAccountId = (accountId: AccountId) =>
  `account/${accountId}` as AuthorizationScope

export const resourceIdFromWalletId = (walletId: WalletId): ResourceId =>
  `wallet/${walletId}` as ResourceId
