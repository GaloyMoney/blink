export const Role = {
  AccountOwner: "account.owner",
} as const

export const WalletPermission = {
  BalanceRead: "wallet:balance:read",
  OnChainSend: "wallet:onChain:send",
  OnChainAddressCreate: "wallet:onChain:createAddress",
}

export const scopeFromAccountId = (accountId: AccountId) =>
  `account/${accountId}` as AuthorizationScope

export const resourceIdFromWalletId = (walletId: WalletId): ResourceId =>
  `wallet/${walletId}` as ResourceId
